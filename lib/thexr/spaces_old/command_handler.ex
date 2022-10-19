defmodule Thexr.SpacesOld.CommandHandler do
  alias Thexr.SpaceServer

  def member_enter(space_id, member_id) do
    payload = %{
      m: EventName.atom_to_int(:member_entered),
      p: %{
        member_id: member_id,
        pos_rot: %{pos: [0, 0, 0], rot: [0, 0, 0, 1]},
        member_state: %{mic_muted: true, nick_name: "abc"}
      },
      ts: :os.system_time(:millisecond)
    }

    SpaceServer.process_event(space_id, :member_entered, payload, nil)
  end

  def create_entity(space_id, type, params \\ []) do
    id = Ecto.UUID.generate()

    components =
      Enum.map(params, fn {k, v} ->
        %{type: to_string(k), data: %{value: v}}
      end)

    payload = %{
      m: EventName.atom_to_int(:entity_created),
      p: %{
        type: type,
        id: id,
        name: "#{type}_#{Thexr.Utils.random_id(5)}",
        components: components
      },
      ts: :os.system_time(:millisecond)
    }

    SpaceServer.process_event(space_id, :entity_created, payload, nil)
    {:ok, id}
  end

  def delete_entity(space_id, entity_id) do
    SpaceServer.process_event(
      space_id,
      :entity_deleted,
      %{
        m: EventName.atom_to_int(:entity_deleted),
        p: %{id: entity_id},
        ts: :os.system_time(:millisecond)
      }
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
      :entity_transformed,
      %{
        m: EventName.atom_to_int(:entity_transformed),
        p: %{id: entity_id, components: components},
        ts: :os.system_time(:millisecond)
      },
      nil
    )
  end

  # { m: "entity_colored", p: { id: string, color: string }, ts?: number } |
  def color_entity(space_id, entity_id, color_string) do
    SpaceServer.process_event(
      space_id,
      :entity_colored,
      %{
        m: EventName.atom_to_int(:entity_colored),
        p: %{id: entity_id, color: color_string},
        ts: :os.system_time(:millisecond)
      },
      nil
    )
  end
end
