defmodule Thexr.SnapshotTest do
  use Thexr.DataCase
  import Thexr.SpacesFixtures

  alias Thexr.Spaces
  alias Thexr.Snapshot
  alias Thexr.Spaces.Entity
  alias Thexr.Repo

  test "creates a snapshot" do
    space = space_fixture()
    Thexr.SpaceSupervisor.start_space(space)

    events = [
      %{
        "m" => "member_entered",
        "p" => %{"member_id" => "jsdfk", "pos_rot" => %{}},
        "ts" => 23423
      },
      %{
        "m" => "member_entered",
        "p" => %{"member_id" => "jsdfk", "pos_rot" => %{}},
        "ts" => 34_789_723
      },
      %{
        "m" => "entity_created",
        "p" => %{
          "type" => "box",
          "id" => "029b7351-98be-4183-8848-579fab7cf5c7",
          "name" => "mybox",
          "components" => [
            %{"type" => "position", "data" => %{"value" => [1, 2, 3]}},
            %{"type" => "rotation", "data" => %{"value" => [2, 3, 5]}},
            %{"type" => "scaling", "data" => %{"value" => [1, 1, 1]}}
          ]
        },
        "ts" => 2_423_423
      },
      %{
        "ts" => 1_649_386_829_984,
        "p" => %{
          "components" => [
            %{
              "data" => %{"value" => [123, 456, 789]},
              "type" => "rotation"
            },
            %{
              "data" => %{"value" => [10, 20, 30]},
              "type" => "scaling"
            }
          ],
          "id" => "029b7351-98be-4183-8848-579fab7cf5c7"
        },
        "m" => "entity_transformed"
      },
      %{
        "ts" => 23_423_423,
        "p" => %{"id" => "029b7351-98be-4183-8848-579fab7cf5c7", "color" => "#FF0000"},
        "m" => "entity_colored"
      },
      %{
        "ts" => 23_423_425,
        "p" => %{"id" => "029b7351-98be-4183-8848-579fab7cf5c7", "color" => "#0000FF"},
        "m" => "entity_colored"
      }
      # %{
      #   "ts" => 23_423_425,
      #   "p" => %{"id" => "029b7351-98be-4183-8848-579fab7cf5c7"},
      #   "m" => "entity_deleted"
      # }
    ]

    Enum.each(events, fn payload ->
      Thexr.SpaceServer.process_event(space.id, payload, self())
    end)

    Process.sleep(50)
    # Snapshot.update_snapshot(space.id)
    Spaces.serialize(space) |> IO.inspect()
  end
end