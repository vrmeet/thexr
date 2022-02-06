defmodule Thexr.SpacesTest do
  use Thexr.DataCase

  alias Thexr.Spaces

  describe "spaces" do
    alias Thexr.Spaces.{Space, Component}

    import Thexr.SpacesFixtures

    test "list_spaces/0 returns all spaces" do
      space = space_fixture()
      assert Spaces.list_spaces() == [space]
    end

    test "get_space!/1 returns the space with given id" do
      space = space_fixture()
      assert Spaces.get_space!(space.id) == space
    end

    test "create_space/1 with valid data creates a space" do
      valid_attrs = %{description: "some description", name: "some name", slug: "some slug"}

      assert {:ok, %Space{} = space} = Spaces.create_space(valid_attrs)
      assert space.description == "some description"
      assert space.name == "some name"
      assert space.slug =~ "some-name"
    end

    test "create_space/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Spaces.create_space(%{})
    end

    test "update_space/2 with valid data updates the space" do
      space = space_fixture()

      update_attrs = %{
        description: "some updated description",
        name: "some updated name",
        slug: "some updated slug"
      }

      assert {:ok, %Space{} = space} = Spaces.update_space(space, update_attrs)
      assert space.description == "some updated description"
      assert space.name == "some updated name"
      assert space.slug == "some updated slug"
    end

    test "update_space/2 with invalid data returns error changeset" do
      space = space_fixture()
      assert {:error, %Ecto.Changeset{}} = Spaces.update_space(space, %{"slug" => nil})
      assert space == Spaces.get_space!(space.id)
    end

    test "delete_space/1 deletes the space" do
      space = space_fixture()
      assert {:ok, %Space{}} = Spaces.delete_space(space)
      assert_raise Ecto.NoResultsError, fn -> Spaces.get_space!(space.id) end
    end

    test "change_space/1 returns a space changeset" do
      space = space_fixture()
      assert %Ecto.Changeset{} = Spaces.change_space(space)
    end

    test "create entity for space" do
      space = space_fixture()
      entities = Spaces.get_all_entities_for_space(space.id)

      assert length(entities) == 0

      Spaces.add_entity_with_broadcast(space, "box")
      entities = Spaces.get_all_entities_for_space(space.id)
      assert length(entities) > 0
    end

    test "update component for entity" do
      space = space_fixture()
      Spaces.add_entity_with_broadcast(space, "box")
      entity = Spaces.get_all_entities_for_space(space.id) |> List.first()
      Spaces.modify_component_with_broadcast(space, entity.id, "color", %{"value" => "#F0000F"})
      component = Repo.get_by(Component, type: "color")
      assert "#F0000F" == component.data.value
    end

    test "delete an entity" do
      space = space_fixture()
      {:ok, entity} = Spaces.add_entity_with_broadcast(space, "box")
      Spaces.delete_entity_with_broadcast(space, entity.id)
      assert [] == Spaces.get_all_entities_for_space(space.id)
    end
  end
end
