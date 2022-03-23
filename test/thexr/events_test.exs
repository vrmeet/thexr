defmodule Thexr.EventsTest do
  use Thexr.DataCase
  import Thexr.SpacesFixtures

  test "send events to a destination" do
    space = space_fixture()
    Thexr.SpaceSupervisor.start_space(space.slug)

    Enum.each(events, fn event ->
      Thexr.SpaceServer.process_event(space.slug, event)
    end)

    Process.sleep(10)
    # check events in genserver
  end
end
