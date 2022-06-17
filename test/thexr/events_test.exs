defmodule Thexr.EventsTest do
  use Thexr.DataCase
  import Thexr.SpacesFixtures

  test "send events to a destination" do
    space = space_fixture()
    Thexr.SpaceSupervisor.start_space(space)

    events = [
      %{
        "m" => EventName.atom_to_int(:member_entered),
        "p" => %{"member_id" => "jsdfk", "pos_rot" => %{}},
        "ts" => 23423
      },
      %{
        "m" => EventName.atom_to_int(:member_entered),
        "p" => %{"member_id" => "jsdfk", "pos_rot" => %{}},
        "ts" => 34_789_723
      }
    ]

    Enum.each(events, fn payload ->
      Thexr.SpaceServer.process_event(space.id, payload, self())
    end)

    Process.sleep(50)
    stored_events = Thexr.Spaces.get_event_stream(space.id)
    assert(stored_events |> length() == 2)

    first = List.first(stored_events)
    last = List.last(stored_events)
    assert(first.sequence < last.sequence)

    assert Thexr.Spaces.max_event_sequence(space.id) == 2
  end
end
