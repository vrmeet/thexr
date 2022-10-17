defmodule Thexr.Spaces do
  @moduledoc """
  The Spaces context.
  """

  import Ecto.Query, warn: false

  alias Thexr.Repo

  alias Thexr.Spaces.{Space, Entity, SerializedMesh}

  # the genserver

  def find_and_nudge_space(space_id) do
    case get_space(space_id) do
      nil ->
        nil

      space ->
        Thexr.SpaceSupervisor.start_space(space)
        pid = Thexr.SpaceServer.pid(space_id)
        {:ok, space, pid}
    end
  end

  # space records

  def list_spaces do
    query = from Space, order_by: [desc: :inserted_at]
    Repo.all(query)
  end

  def get_space(id), do: Repo.get(Space, id)

  def new_space() do
    %Space{id: Thexr.Utils.random_id(5), state_id: Thexr.Utils.random_id(5)}
  end

  def create_space(attrs \\ %{}) do
    {:ok, space} =
      %Space{}
      |> Space.changeset(attrs)
      |> Repo.insert()

    Thexr.SpaceSupervisor.start_space(space)

    Thexr.SpaceServer.process_event(
      space.id,
      "entity_created",
      %{
        "id" => "my-light",
        "components" => %{
          "lighting" => %{}
        }
      },
      nil
    )

    Thexr.SpaceServer.process_event(
      space.id,
      "entity_created",
      %{
        "id" => "grid-floor",
        "components" => %{
          "shape" => %{"prim" => "plane", "prim_params" => %{"size" => 25}},
          "transform" => %{"rotation" => [-1.5708, 0, 0]},
          "material" => %{"name" => "grid"},
          "floor" => %{}
        }
      },
      nil
    )

    {:ok, space}
  end

  def delete_space(%Space{} = space) do
    Repo.delete(space)
  end

  def change_space(%Space{} = space, attrs \\ %{}) do
    Space.changeset(space, attrs)
  end

  def update_space(%Space{} = space, attrs) do
    space
    |> Space.changeset(attrs)
    |> Repo.update()
  end

  # state records

  def get_state(state_id, pid) do
    server_state = Thexr.SpaceServer.space_state(pid)
    db_state = get_state(state_id)
    DeepMerge.deep_merge(db_state, server_state)
  end

  def get_state(state_id) do
    query = from(e in Entity, select: {e.id, e.components}, where: e.state_id == ^state_id)
    Repo.all(query) |> Enum.into(%{})
  end

  def list_entities(state_id) do
    query = from(e in Entity, where: e.state_id == ^state_id)
    Repo.all(query)
  end

  def get_entity(state_id, entity_id) do
    query =
      from e in Entity,
        select: e.components,
        where: e.state_id == ^state_id and e.id == ^entity_id

    Repo.one(query)
  end

  def upsert_entity(state_id, entity_id, nil) do
    delete_entity(state_id, entity_id)
  end

  def upsert_entity(state_id, entity_id, components) do
    new_components =
      case get_entity(state_id, entity_id) do
        nil ->
          components

        old_components ->
          DeepMerge.deep_merge(old_components, components)
      end

    Repo.insert(
      %Entity{
        state_id: state_id,
        id: entity_id,
        components: new_components
      },
      on_conflict: [set: [components: new_components]],
      conflict_target: [:state_id, :id]
    )

    # serialized meshes are uploaded and created ahead of entities
    # if this entity has a pointer to mesh id, add an entry to the join
    # table so we can keep track of serialized mesh usage
    case new_components do
      %{"serialized_mesh" => %{"mesh_id" => mesh_id}} ->
        Repo.insert_all(
          "entity_meshes",
          [
            [state_id: state_id, entity_id: entity_id, mesh_id: mesh_id]
          ],
          on_conflict: :nothing
        )

      _ ->
        :noop
    end
  end

  # lookup a serialized mesh_id, if it has one
  def entity_serialized_mesh_id(state_id, entity_id) do
    query =
      from(e in "entity_meshes",
        where: e.state_id == ^state_id and e.entity_id == ^entity_id,
        select: [:mesh_id]
      )

    case Repo.one(query) do
      nil -> :none
      %{mesh_id: mesh_id} -> {:ok, mesh_id}
    end
  end

  def serialized_mesh_usage_count(state_id, mesh_id) do
    query =
      from(e in "entity_meshes",
        where: e.state_id == ^state_id and e.mesh_id == ^mesh_id
      )

    Repo.aggregate(query, :count, :mesh_id)
  end

  def delete_entity(state_id, entity_id) do
    with {:ok, mesh_id} <- entity_serialized_mesh_id(state_id, entity_id),
         1 <- serialized_mesh_usage_count(state_id, mesh_id) do
      query2 =
        from(s in SerializedMesh,
          where: s.state_id == ^state_id and s.id == ^mesh_id
        )

      Repo.delete_all(query2)
    end

    query =
      from(e in Entity,
        where: e.state_id == ^state_id and e.id == ^entity_id
      )

    Repo.delete_all(query)
  end

  def persist_state(state_id, state) do
    Enum.each(state, fn {entity_id, components} ->
      upsert_entity(state_id, entity_id, components)
    end)
  end

  ### serialized meshes

  def get_serialized_mesh(state_id, mesh_id) do
    Repo.get_by(SerializedMesh, state_id: state_id, id: mesh_id)
  end

  def save_serialized_mesh(state_id, mesh_id, data) do
    Repo.insert(%SerializedMesh{state_id: state_id, id: mesh_id, data: data})
  end

  def delete_serialized_mesh(state_id, mesh_id) do
    query =
      from s in SerializedMesh,
        where: s.state_id == ^state_id and s.id == ^mesh_id

    Repo.delete_all(query)
  end
end
