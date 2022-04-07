defmodule Thexr.Snapshot do
  import Ecto.Query, warn: false
  alias Thexr.Repo
  alias Ecto.Multi

  alias Thexr.Spaces.Entity

  alias Thexr.Spaces

  def clear_snapshot(space_id) do
    query = from(e in Entity, where: e.space_id == ^space_id)
    Repo.delete_all(query)
  end

  def update_snapshot(space_id, last_sequence \\ 0) do
    events = Spaces.event_stream(space_id, last_sequence)
    Enum.each(events, fn event -> process(space_id, event.type, event) end)
  end

  def process(_space_id, "member_entered", _) do
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

    # Repo.insert(changeset)
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
