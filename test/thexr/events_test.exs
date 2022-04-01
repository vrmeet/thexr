defmodule Thexr.EventsTest do
  use Thexr.DataCase
  import Thexr.SpacesFixtures

  test "send events to a destination" do
    space = space_fixture()
    Thexr.SpaceSupervisor.start_space(space)

    events = [
      {"name1", %{}, 23_432_423_432, self()},
      {"name2", %{}, 2_343_223_432, self()}
    ]

    Enum.each(events, fn {n, p, t, pid} ->
      Thexr.SpaceServer.process_event(space.slug, n, p, t, pid)
    end)

    Process.sleep(50)
    stored_events = Thexr.Spaces.event_stream(space.id)
    assert(stored_events |> length() == 2)

    first = List.first(stored_events)
    last = List.last(stored_events)
    assert(first.sequence < last.sequence)
  end
end
