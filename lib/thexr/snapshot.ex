defmodule Thexr.Snapshot do
  import Ecto.Query, warn: false
  alias Thexr.Repo
  alias Ecto.Multi

  alias Thexr.Spaces.{Entity, Component}

  alias Thexr.Spaces

  def clear_snapshot(space_id) do
    query = from(e in Entity, where: e.space_id == ^space_id)
    Repo.delete_all(query)
  end

  def update_snapshot(space_id, last_evaluated_sequence \\ 0) do
    events = Spaces.event_stream(space_id, last_evaluated_sequence)

    Enum.each(events, fn event ->
      {msg, evt} = Thexr.Utils.tupleize_event_payload(event)
      process(space_id, msg, evt)
    end)
  end

  # TODO: should this also be an upsert?  So that the entity can be re-created with different
  # params, like changing the depth, height of a cone?
  def process(space_id, :entity_created, payload) do
    changeset =
      %Entity{space_id: space_id}
      |> Entity.changeset(payload)
      |> IO.inspect(label: "entity_created changeset")

    Multi.new()
    |> Multi.insert(:entity, changeset)
    |> Repo.transaction()
  end

  # actually allows upserting any and all components for an entity
  def process(_space_id, :entity_transformed, %{id: entity_id, components: components}) do
    Enum.reduce(
      components,
      Multi.new(),
      fn component, prev_multi ->
        Ecto.Multi.insert(
          prev_multi,
          String.to_atom(component.name),
          %Component{entity_id: entity_id, type: component.type, data: component.data},
          on_conflict: [set: [data: component.data]],
          conflict_target: [:entity_id, :type]
        )
      end
    )
    |> Repo.transaction()
  end

  def process(_space_id, :entity_colored, %{id: entity_id, color: color}) do
    # upsert color component
    Repo.insert_all(
      Component,
      [%{entity_id: entity_id, type: "color", data: %{value: color}}],
      on_conflict: {:replace, [:data]},
      conflict_target: [:entity_id, :type]
    )
  end

  def process(_space_id, :entity_deleted, %{id: entity_id}) do
    from(e in Entity, where: e.id == ^entity_id) |> Repo.delete_all()
  end

  def process(space_id, :entity_grabbed, %{
        entity_id: entity_id,
        entity_pos_rot: %{pos: pos, rot: rot}
      }) do
    process(space_id, :entity_transformed, %{
      id: entity_id,
      components: [
        %{type: "position", data: %{value: pos}},
        %{type: "rotation", data: %{value: rot}}
      ]
    })
  end

  def process(space_id, :entity_released, %{
        entity_id: entity_id,
        entity_pos_rot: %{pos: pos, rot: rot}
      }) do
    process(space_id, :entity_transformed, %{
      id: entity_id,
      components: [
        %{type: "position", data: %{value: pos}},
        %{type: "rotation", data: %{value: rot}}
      ]
    })
  end

  def process(s, m, e) do
    # temp logging to see what events we're getting

    if m !== :member_moved do
      IO.inspect(s, label: "GOT-----------------------")
      IO.inspect(m, label: "GOT-----------------------")
      IO.inspect(e, label: "GOT-----------------------")
    end
  end

  # def process(space_id, "entity_created", %{payload: %{"id" => id, "type" => type, "name" => name, "components" => components}}) do
  #   attrs = %{id: id, space_id: space_id, name: name, type: type, components: components}
  #   attrs = Entity.build_default_components(attrs)

  #     changeset =
  #       %Entity{}
  #       |> Entity.changeset(attrs)

  #     {:ok, %{entity: entity}} =
  #       Multi.new()
  #       |> Multi.insert(:entity, changeset)
  #       |> Repo.transaction()

  #     {:ok, entity}

  #   end
  # end
end
