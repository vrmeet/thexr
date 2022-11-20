defmodule Thexr.SpacesTest do
  use Thexr.DataCase

  alias Thexr.Spaces

  import Thexr.SpacesFixtures

  describe "spaces" do
    test "can create a space" do
      space = space_fixture()
      Thexr.SpaceServer.space_state(space.id) |> IO.inspect(label: "genserver")
      Spaces.get_state(space.state_id) |> IO.inspect(label: "database")
      :timer.sleep(6000)
      IO.puts("--------------------")
      Thexr.SpaceServer.space_state(space.id) |> IO.inspect(label: "genserver")
      Spaces.get_state(space.state_id) |> IO.inspect(label: "database")
    end

    # @state_id "fake_state_id"
    # @entity_id "fake_entity_id"
    # @entity_id2 "fake_entity_id2"
    # @mesh_id "fake_mesh_id"

    # test "deleting an entity will remove it's serialized mesh" do
    #   # the UI will save the serialized mesh, even before entity is created
    #   Spaces.save_state_mesh(@state_id, @mesh_id, %{})

    #   Spaces.upsert_entity(@state_id, @entity_id, %{"serialized_mesh" => %{"mesh_id" => @mesh_id}})

    #   assert Repo.aggregate(from(e in "entities"), :count, :id) == 1
    #   assert Repo.aggregate(from(e in "entity_meshes"), :count, :mesh_id) == 1
    #   assert Repo.aggregate(from(m in "serialized_meshes"), :count, :id) == 1
    #   Spaces.delete_entity(@state_id, @entity_id)
    #   assert Repo.aggregate(from(e in "entities"), :count, :id) == 0
    #   assert Repo.aggregate(from(e in "entity_meshes"), :count, :mesh_id) == 0
    #   assert Repo.aggregate(from(m in "serialized_meshes"), :count, :id) == 0
    # end

    # test "duplicate a mesh" do
    #   Spaces.save_state_mesh(@state_id, @mesh_id, %{})

    #   Spaces.upsert_entity(@state_id, @entity_id, %{"serialized_mesh" => %{"mesh_id" => @mesh_id}})

    #   # dup, makes a new entity_id pointing to the same mesh_id
    #   Spaces.upsert_entity(@state_id, @entity_id2, %{
    #     "serialized_mesh" => %{"mesh_id" => @mesh_id}
    #   })

    #   assert Repo.aggregate(from(e in "entities"), :count, :id) == 2
    #   assert Repo.aggregate(from(e in "entity_meshes"), :count, :mesh_id) == 2
    #   assert Repo.aggregate(from(m in "serialized_meshes"), :count, :id) == 1

    #   # but if we delete one, entity, the serialized mesh will stay for the other entity
    #   Spaces.delete_entity(@state_id, @entity_id)
    #   assert Repo.aggregate(from(e in "entities"), :count, :id) == 1
    #   assert Repo.aggregate(from(e in "entity_meshes"), :count, :mesh_id) == 1
    #   assert Repo.aggregate(from(m in "serialized_meshes"), :count, :id) == 1
    #   # finally if we delete the last entity, it will remove the serialized mesh
    #   Spaces.delete_entity(@state_id, @entity_id2)
    #   assert Repo.aggregate(from(e in "entities"), :count, :id) == 0
    #   assert Repo.aggregate(from(e in "entity_meshes"), :count, :mesh_id) == 0
    #   assert Repo.aggregate(from(m in "serialized_meshes"), :count, :id) == 0
    # end

    # test "deleting a space will remove its state entities and serialized meshes" do
    #   {:ok, space} = Spaces.create_space(%{id: "abc", name: "abc", state_id: @state_id})
    #   Spaces.save_state_mesh(@state_id, @mesh_id, %{})

    #   Spaces.upsert_entity(@state_id, @entity_id, %{"serialized_mesh" => %{"mesh_id" => @mesh_id}})

    #   Spaces.delete_space(space)
    #   assert Repo.aggregate(from(e in "entities"), :count, :id) == 0
    #   assert Repo.aggregate(from(e in "entity_meshes"), :count, :mesh_id) == 0
    #   assert Repo.aggregate(from(m in "serialized_meshes"), :count, :id) == 0
    # end

    # test "persists space state" do
    #   state = %{
    #     "F5kFjp" => %{
    #       "attendance" => %{"mic_muted" => true, "nickname" => "chrome1"},
    #       "avatar" => %{
    #         "head" => %{
    #           "pos" => [-0.15529, 1.5, -1.2942],
    #           "rot" => [-0.00142, 0.98868, 0.00939, 0.14973]
    #         },
    #         "left" => nil,
    #         "right" => nil
    #       }
    #     },
    #     "door" => %{
    #       "acts_like_lift" => %{"height" => 2, "speed" => 0.01, "state" => "down"},
    #       "material" => %{"color_string" => "#FF0000", "name" => "color"},
    #       "shape" => %{"prim" => "box", "prim_params" => %{"height" => 0.1}},
    #       "transform" => %{"position" => [0, 1, 0]}
    #     },
    #     "grab_anywhere" => %{
    #       "grabbable" => %{"pickup" => "any", "throwable" => true},
    #       "material" => %{"color_string" => "#FF0000", "name" => "color"},
    #       "shape" => %{"prim" => "box", "prim_params" => %{"size" => 0.3}},
    #       "transform" => %{"position" => [0.5, 1.5, -5]}
    #     },
    #     "grab_snap" => %{
    #       "grabbable" => %{"pickup" => "fixed", "throwable" => true},
    #       "material" => %{"color_string" => "#00FF00", "name" => "color"},
    #       "shape" => %{"prim" => "box", "prim_params" => %{"size" => 0.25}},
    #       "transform" => %{"position" => [-0.5, 0.5, -5]}
    #     },
    #     "grid-floor" => %{
    #       "floor" => %{},
    #       "material" => %{"name" => "grid"},
    #       "shape" => %{"prim" => "plane", "prim_params" => %{"size" => 25}},
    #       "transform" => %{"rotation" => [1.5708, 0, 0]}
    #     },
    #     "gun" => %{
    #       "grabbable" => %{"pickup" => "fixed"},
    #       "material" => %{"color_string" => "#0000FF", "name" => "color"},
    #       "shape" => %{"prim" => "box", "prim_params" => %{"size" => 0.1}},
    #       "shootable" => %{},
    #       "transform" => %{"position" => [1.1, 1, 2.2]}
    #     },
    #     "my-light" => %{"lighting" => %{}}
    #   }

    #   state_id = "test-state"
    #   Spaces.persist_state(state_id, state)
    #   Spaces.get_state(state_id)
    # end
  end
end
