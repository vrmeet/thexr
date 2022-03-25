defmodule Thexr.EventsTest do
  use Thexr.DataCase
  import Thexr.SpacesFixtures

  test "send events to a destination" do
    space = space_fixture()
    Thexr.SpaceSupervisor.start_space(space)

    events = [
      %Thexr.Events.MemberEntered{space_id: space.id, id: "abc"},
      %Thexr.Events.GridCreated{}
    ]

    Enum.each(events, fn event ->
      Thexr.SpaceServer.process_event(space.slug, event)
    end)

    Process.sleep(50)

    assert(Thexr.Spaces.list_events(space.id) |> length() == 2)
  end
end
