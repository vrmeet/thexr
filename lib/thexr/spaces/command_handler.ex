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

  # export type Component =
  #   { type: "position", data: { value: number[] } } |
  #   { type: "rotation", data: { value: number[] } } |
  #   { type: "scaling", data: { value: number[] } } |
  #   { type: "color", data: { value: string } }

  # { m: "entity_transformed", p: { id: string, components: Component[] }, ts?: number } |
  def transform_entity(space_id, entity_id, components) do
    SpaceServer.process_event(
      space_id,
      %{
        "m" => "entity_transformed",
        "p" => %{"id" => entity_id, "components" => components},
        "ts" => :os.system_time(:millisecond)
      },
      nil
    )
  end

  # { m: "entity_colored", p: { id: string, color: string }, ts?: number } |
  def color_entity(space_id, entity_id, color_string) do
    SpaceServer.process_event(
      space_id,
      %{
        "m" => "entity_colored",
        "p" => %{"id" => entity_id, "color" => color_string},
        "ts" => :os.system_time(:millisecond)
      },
      nil
    )
  end
end
