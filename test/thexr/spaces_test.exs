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
  end

  describe "parenting entities" do
    alias Thexr.Spaces.Entity

    import Thexr.SpacesFixtures

    setup do
      # create top level entities, A, B, C, D
      # set hierarchy
      #   A
      #  / \
      # B   C
      #      \
      #       D
      a = entity_fixture(%{name: "a"})
      b = entity_fixture(%{space_id: a.space_id, name: "b"})
      c = entity_fixture(%{space_id: a.space_id, name: "c"})
      d = entity_fixture(%{space_id: a.space_id, name: "d"})
      Spaces.parent_entity(b.id, a.id)
      Spaces.parent_entity(c.id, a.id)
      Spaces.parent_entity(d.id, c.id)

      %{
        a: Spaces.get_entity!(a.id),
        b: Spaces.get_entity!(b.id),
        c: Spaces.get_entity!(c.id),
        d: Spaces.get_entity!(d.id)
      }
    end

    test "immediate parent is set", %{a: a, b: b, c: c} do
      # B and C have parent_id set and it is A.id
      assert b.parent_id == a.id
      assert c.parent_id == a.id
    end

    test "child_count is set", %{a: a, c: c} do
      # A has child count of 2
      assert a.child_count == 2
      # C has child count of 1
      assert c.child_count == 1
    end

    test "ancestor lookup works", %{a: a, b: b, c: c, d: d} do
      # A is an ancestor to everyone
      assert {true, _} = Spaces.entity_has_ancestor?(d.id, a.id)
      # C is an ancestor to D
      assert {true, _} = Spaces.entity_has_ancestor?(d.id, c.id)
      # B is not an ancestor of C or D
      assert {false, _} = Spaces.entity_has_ancestor?(c.id, b.id)
      assert {false, _} = Spaces.entity_has_ancestor?(d.id, b.id)
    end

    test "unparent B", %{a: a, b: b} do
      Spaces.unparent_entity(b.id)
      # refresh
      %{a: a, b: b} = %{
        a: Spaces.get_entity!(a.id),
        b: Spaces.get_entity!(b.id)
      }

      # B has no parent_id
      assert b.parent_id == nil
      # A has child_count of 1
      assert a.child_count == 1
      # A is not ancestor of B
      assert {false, _} = Spaces.entity_has_ancestor?(b.id, a.id)
    end

    test "unparent C", %{a: a, c: c, d: d} do
      Spaces.unparent_entity(c.id)
      # refresh
      %{a: a, c: c, d: d} = %{
        a: Spaces.get_entity!(a.id),
        c: Spaces.get_entity!(c.id),
        d: Spaces.get_entity!(d.id)
      }

      # C becomes parentless
      assert c.parent_id == nil
      # D is not a descendant of A
      assert {false, _} = Spaces.entity_has_ancestor?(d.id, a.id)
      # C remains an ancestor of D
      assert {true, _} = Spaces.entity_has_ancestor?(d.id, c.id)
    end

    test "move B under D", %{a: a, b: b, c: c, d: d} do
      Spaces.parent_entity(b.id, d.id)
      # refresh
      %{a: a, b: b, c: c, d: d} = %{
        a: Spaces.get_entity!(a.id),
        b: Spaces.get_entity!(b.id),
        c: Spaces.get_entity!(c.id),
        d: Spaces.get_entity!(d.id)
      }

      # A, C and D are all ancestors of B
      assert {true, _} = Spaces.entity_has_ancestor?(b.id, a.id)
      assert {true, _} = Spaces.entity_has_ancestor?(b.id, c.id)
      assert {true, _} = Spaces.entity_has_ancestor?(b.id, d.id)

      # A has child count of 1
      assert a.child_count == 1
    end

    test "move C under B", %{a: a, b: b, c: c, d: d} do
      Spaces.parent_entity(c.id, b.id)
      # refresh
      %{a: a, b: b, c: c, d: d} = %{
        a: Spaces.get_entity!(a.id),
        b: Spaces.get_entity!(b.id),
        c: Spaces.get_entity!(c.id),
        d: Spaces.get_entity!(d.id)
      }

      # D has B and A as ancestors
      assert {true, _} = Spaces.entity_has_ancestor?(d.id, b.id)
      assert {true, _} = Spaces.entity_has_ancestor?(d.id, a.id)
      assert {true, _} = Spaces.entity_has_ancestor?(c.id, a.id)
    end

    test "prevent circular reference", %{c: c, d: d} do
      refute Spaces.parent_entity(c.id, d.id)
    end
  end

  # describe "components" do
  #   alias Thexr.Spaces.Component

  #   import Thexr.SpacesFixtures

  #   @invalid_attrs %{data: nil, type: nil}

  #   test "list_components/0 returns all components" do
  #     component = component_fixture()
  #     assert Spaces.list_components() == [component]
  #   end

  #   test "get_component!/1 returns the component with given id" do
  #     component = component_fixture()
  #     assert Spaces.get_component!(component.id) == component
  #   end

  #   test "create_component/1 with valid data creates a component" do
  #     valid_attrs = %{data: %{}, type: "some type"}

  #     assert {:ok, %Component{} = component} = Spaces.create_component(valid_attrs)
  #     assert component.data == %{}
  #     assert component.type == "some type"
  #   end

  #   test "create_component/1 with invalid data returns error changeset" do
  #     assert {:error, %Ecto.Changeset{}} = Spaces.create_component(@invalid_attrs)
  #   end

  #   test "update_component/2 with valid data updates the component" do
  #     component = component_fixture()
  #     update_attrs = %{data: %{}, type: "some updated type"}

  #     assert {:ok, %Component{} = component} = Spaces.update_component(component, update_attrs)
  #     assert component.data == %{}
  #     assert component.type == "some updated type"
  #   end

  #   test "update_component/2 with invalid data returns error changeset" do
  #     component = component_fixture()
  #     assert {:error, %Ecto.Changeset{}} = Spaces.update_component(component, @invalid_attrs)
  #     assert component == Spaces.get_component!(component.id)
  #   end

  #   test "delete_component/1 deletes the component" do
  #     component = component_fixture()
  #     assert {:ok, %Component{}} = Spaces.delete_component(component)
  #     assert_raise Ecto.NoResultsError, fn -> Spaces.get_component!(component.id) end
  #   end

  #   test "change_component/1 returns a component changeset" do
  #     component = component_fixture()
  #     assert %Ecto.Changeset{} = Spaces.change_component(component)
  #   end
  # end

  describe "plugins" do
    alias Thexr.Spaces.Plugin

    import Thexr.SpacesFixtures

    @invalid_attrs %{js: nil, ts: nil}

    test "list_plugins/0 returns all plugins" do
      plugin = plugin_fixture()
      assert Spaces.list_plugins() == [plugin]
    end

    test "get_plugin!/1 returns the plugin with given id" do
      plugin = plugin_fixture()
      assert Spaces.get_plugin!(plugin.id) == plugin
    end

    test "create_plugin/1 with valid data creates a plugin" do
      valid_attrs = %{js: "some js", ts: "some ts"}

      assert {:ok, %Plugin{} = plugin} = Spaces.create_plugin(valid_attrs)
      assert plugin.js == "some js"
      assert plugin.ts == "some ts"
    end

    test "create_plugin/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Spaces.create_plugin(@invalid_attrs)
    end

    test "update_plugin/2 with valid data updates the plugin" do
      plugin = plugin_fixture()
      update_attrs = %{js: "some updated js", ts: "some updated ts"}

      assert {:ok, %Plugin{} = plugin} = Spaces.update_plugin(plugin, update_attrs)
      assert plugin.js == "some updated js"
      assert plugin.ts == "some updated ts"
    end

    test "update_plugin/2 with invalid data returns error changeset" do
      plugin = plugin_fixture()
      assert {:error, %Ecto.Changeset{}} = Spaces.update_plugin(plugin, @invalid_attrs)
      assert plugin == Spaces.get_plugin!(plugin.id)
    end

    test "delete_plugin/1 deletes the plugin" do
      plugin = plugin_fixture()
      assert {:ok, %Plugin{}} = Spaces.delete_plugin(plugin)
      assert_raise Ecto.NoResultsError, fn -> Spaces.get_plugin!(plugin.id) end
    end

    test "change_plugin/1 returns a plugin changeset" do
      plugin = plugin_fixture()
      assert %Ecto.Changeset{} = Spaces.change_plugin(plugin)
    end
  end

  describe "templates" do
    alias Thexr.Spaces.Template

    import Thexr.SpacesFixtures

    @invalid_attrs %{data: nil, description: nil, name: nil}

    test "list_templates/0 returns all templates" do
      template = template_fixture()
      assert Spaces.list_templates() == [template]
    end

    test "get_template!/1 returns the template with given id" do
      template = template_fixture()
      assert Spaces.get_template!(template.id) == template
    end

    test "create_template/1 with valid data creates a template" do
      valid_attrs = %{data: %{}, description: "some description", name: "some name"}

      assert {:ok, %Template{} = template} = Spaces.create_template(valid_attrs)
      assert template.data == %{}
      assert template.description == "some description"
      assert template.name == "some name"
    end

    test "create_template/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Spaces.create_template(@invalid_attrs)
    end

    test "update_template/2 with valid data updates the template" do
      template = template_fixture()
      update_attrs = %{data: %{}, description: "some updated description", name: "some updated name"}

      assert {:ok, %Template{} = template} = Spaces.update_template(template, update_attrs)
      assert template.data == %{}
      assert template.description == "some updated description"
      assert template.name == "some updated name"
    end

    test "update_template/2 with invalid data returns error changeset" do
      template = template_fixture()
      assert {:error, %Ecto.Changeset{}} = Spaces.update_template(template, @invalid_attrs)
      assert template == Spaces.get_template!(template.id)
    end

    test "delete_template/1 deletes the template" do
      template = template_fixture()
      assert {:ok, %Template{}} = Spaces.delete_template(template)
      assert_raise Ecto.NoResultsError, fn -> Spaces.get_template!(template.id) end
    end

    test "change_template/1 returns a template changeset" do
      template = template_fixture()
      assert %Ecto.Changeset{} = Spaces.change_template(template)
    end
  end
end
