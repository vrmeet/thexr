defmodule Thexr.Spaces.CommandHandler do
  alias Thexr.SpaceServer

  def create_entity(space_id, type) do
    id = Ecto.UUID.generate()

    payload = %{
      "m" => "entity_created",
      "p" => %{
        "type" => type,
        "id" => id,
        "name" => "#{type}_#{Thexr.Utils.random_id(5)}",
        "components" => [
          %{"type" => "position", "data" => %{"value" => [0, 0, 0]}},
          %{"type" => "rotation", "data" => %{"value" => [0, 0, 0]}},
          %{"type" => "scaling", "data" => %{"value" => [1, 1, 1]}}
        ]
      },
      "ts" => :os.system_time(:millisecond)
    }

    SpaceServer.process_event(space_id, payload, nil)
    {:ok, id}
  end

  def delete_entity(space_id, entity_id) do
    SpaceServer.process_event(
      space_id,
      %{
        "m" => "entity_deleted",
        "p" => %{"id" => entity_id},
        "ts" => :os.system_time(:millisecond)
      },
      nil
    )
  end
end