defmodule Thexr.SpacesTest do
  use Thexr.DataCase

  alias Thexr.Spaces

  describe "spaces" do
    alias Thexr.Spaces.Space

    import Thexr.SpacesFixtures

    @invalid_attrs %{description: nil, name: nil, slug: nil}

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
      assert space.slug == "some slug"
    end

    test "create_space/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Spaces.create_space(@invalid_attrs)
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
      assert {:error, %Ecto.Changeset{}} = Spaces.update_space(space, @invalid_attrs)
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
  end

  describe "entities" do
    alias Thexr.Spaces.Entity

    import Thexr.SpacesFixtures

    @invalid_attrs %{name: nil, type: nil}

    test "list_entities/0 returns all entities" do
      entity = entity_fixture()
      assert Spaces.list_entities() == [entity]
    end

    test "get_entity!/1 returns the entity with given id" do
      entity = entity_fixture()
      assert Spaces.get_entity!(entity.id) == entity
    end

    test "create_entity/1 with valid data creates a entity" do
      space = space_fixture()
      valid_attrs = %{name: "some name", type: "some type", space_id: space.id}

      assert {:ok, %Entity{} = entity} = Spaces.create_entity(valid_attrs)
      assert entity.name == "some name"
      assert entity.type == "some type"
    end

    test "create_entity/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Spaces.create_entity(@invalid_attrs)
    end

    test "update_entity/2 with valid data updates the entity" do
      entity = entity_fixture()
      update_attrs = %{name: "some updated name", type: "some updated type"}

      assert {:ok, %Entity{} = entity} = Spaces.update_entity(entity, update_attrs)
      assert entity.name == "some updated name"
      assert entity.type == "some updated type"
    end

    test "update_entity/2 with invalid data returns error changeset" do
      entity = entity_fixture()
      assert {:error, %Ecto.Changeset{}} = Spaces.update_entity(entity, @invalid_attrs)
      assert entity == Spaces.get_entity!(entity.id)
    end

    test "delete_entity/1 deletes the entity" do
      entity = entity_fixture()
      assert {:ok, %Entity{}} = Spaces.delete_entity(entity)
      assert_raise Ecto.NoResultsError, fn -> Spaces.get_entity!(entity.id) end
    end

    test "change_entity/1 returns a entity changeset" do
      entity = entity_fixture()
      assert %Ecto.Changeset{} = Spaces.change_entity(entity)
    end

    test "parent entity" do
      entity1 = entity_fixture()
      entity2 = entity_fixture(%{space_id: entity1.space_id})
      Spaces.parent_entity(entity2.id, entity1.id)
      # reload parent
      entity1 = entity1 |> Repo.preload(:children)
      assert length(entity1.children) == 1
      IO.inspect(entity1, label: "entity1")
      # assert entity1.child_count == 1

      assert(Spaces.get_entity!(entity2.id).parent_id != nil)
    end
  end

  describe "components" do
    alias Thexr.Spaces.Component

    import Thexr.SpacesFixtures

    @invalid_attrs %{data: nil, type: nil}

    test "list_components/0 returns all components" do
      component = component_fixture()
      assert Spaces.list_components() == [component]
    end

    test "get_component!/1 returns the component with given id" do
      component = component_fixture()
      assert Spaces.get_component!(component.id) == component
    end

    test "create_component/1 with valid data creates a component" do
      valid_attrs = %{data: %{}, type: "some type"}

      assert {:ok, %Component{} = component} = Spaces.create_component(valid_attrs)
      assert component.data == %{}
      assert component.type == "some type"
    end

    test "create_component/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Spaces.create_component(@invalid_attrs)
    end

    test "update_component/2 with valid data updates the component" do
      component = component_fixture()
      update_attrs = %{data: %{}, type: "some updated type"}

      assert {:ok, %Component{} = component} = Spaces.update_component(component, update_attrs)
      assert component.data == %{}
      assert component.type == "some updated type"
    end

    test "update_component/2 with invalid data returns error changeset" do
      component = component_fixture()
      assert {:error, %Ecto.Changeset{}} = Spaces.update_component(component, @invalid_attrs)
      assert component == Spaces.get_component!(component.id)
    end

    test "delete_component/1 deletes the component" do
      component = component_fixture()
      assert {:ok, %Component{}} = Spaces.delete_component(component)
      assert_raise Ecto.NoResultsError, fn -> Spaces.get_component!(component.id) end
    end

    test "change_component/1 returns a component changeset" do
      component = component_fixture()
      assert %Ecto.Changeset{} = Spaces.change_component(component)
    end
  end
end
