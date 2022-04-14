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

  def update_snapshot(space_id, last_sequence \\ 0) do
    events = Spaces.event_stream(space_id, last_sequence)

    Enum.each(events, fn event ->
      process(space_id, event.type, AtomicMap.convert(event, %{safe: false}))
    end)
  end

  def process(space_id, "entity_created", %{
        payload: payload
      }) do
    changeset =
      %Entity{space_id: space_id}
      |> Entity.changeset(payload)

    Multi.new()
    |> Multi.insert(:entity, changeset)
    |> Repo.transaction()
  end

  def process(_space_id, "entity_transformed", %{
        payload: %{id: entity_id, components: components}
      }) do
    multi = Multi.new()

    Enum.reduce(
      components,
      multi,
      fn component, prev_multi ->
        query =
          from(c in Component,
            where: c.entity_id == ^entity_id and c.type == ^component.type,
            update: [set: [data: ^component.data]]
          )

        Multi.update_all(prev_multi, component.type, query, [])
      end
    )
    |> Repo.transaction()
  end

  def process(_space_id, "entity_colored", %{payload: %{id: entity_id, color: color}}) do
    Repo.insert_all(
      Component,
      [%{entity_id: entity_id, type: "color", data: %{value: color}}],
      on_conflict: {:replace, [:data]},
      conflict_target: [:entity_id, :type]
    )
  end

  def process(_space_id, "entity_deleted", %{payload: %{id: entity_id}}) do
    from(e in Entity, where: e.id == ^entity_id) |> Repo.delete_all()
  end

  # { m: "entity_deleted", p: { id: string }, ts?: number }

  def process(s, m, e) do
    #   IO.inspect(s, label: "space_id")
    #  IO.inspect(e, label: "no match #{m}")
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
