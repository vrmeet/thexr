defmodule Thexr.Spaces do
  @moduledoc """
  The Spaces context.
  """

  import Ecto.Query, warn: false

  alias Thexr.Repo

  alias Thexr.Spaces.{Space, State}

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
    query = from(s in State, select: {s.entity_id, s.components}, where: s.state_id == ^state_id)
    Repo.all(query) |> Enum.into(%{})
  end

  def get_entity(state_id, entity_id) do
    query =
      from s in State,
        select: s.components,
        where: s.state_id == ^state_id and s.entity_id == ^entity_id

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
      %State{
        state_id: state_id,
        entity_id: entity_id,
        components: new_components
      },
      on_conflict: [set: [components: new_components]],
      conflict_target: [:state_id, :entity_id]
    )
  end

  def delete_entity(state_id, entity_id) do
    query =
      from s in State,
        select: s.components,
        where: s.state_id == ^state_id and s.entity_id == ^entity_id

    Repo.delete_all(query)
  end

  def persist_state(state_id, state) do
    Enum.each(state, fn {entity_id, components} ->
      upsert_entity(state_id, entity_id, components)
    end)

    # |> Enum.reduce(Ecto.Multi.new(), fn {entity_id, components}, multi ->
    #   # IO.inspect(entity_id)
    #   # IO.inspect(components)
    #   # multi
    #   case components do
    #     nil ->
    #       Ecto.Multi.delete_all(
    #         multi,
    #         {:delete, entity_id},
    #         from(s in State, where: s.state_id == ^state_id and s.entity_id == ^entity_id)
    #       )

    #     %{} ->
    #       Enum.reduce(components, multi, fn {name, value}, acc ->
    #         json_string = Jason.encode!(value)

    #         Ecto.Multi.insert(
    #           acc,
    #           {entity_id, name},
    #           %State{
    #             state_id: state_id,
    #             entity_id: entity_id,
    #             component_name: name,
    #             component_value: json_string
    #           },
    #           on_conflict: [set: [component_value: json_string]],
    #           conflict_target: [:state_id, :entity_id, :component_name]
    #         )
    #       end)
    #   end

    #   # Ecto.Multi.insert(multi, , profile, on_conflict: [set: [profile: profile_url]], conflict_target: [:source, :source_uuid])
    # end)
    # |> Repo.transaction()

    # # Enum.reduce(state, %{}, fn ({k, v}, acc) ->
    # #   IO.inspect(k)
    # #   IO.inspect(v)
    # # end)
    # Enum.map(state, fn {entity_id, components} ->
    #   IO.inspect(k)
    #   IO.inspect(v)
    # end)
  end
end
