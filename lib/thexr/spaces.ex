defmodule Thexr.Spaces do
  @moduledoc """
  The Spaces context.
  """

  import Ecto.Query, warn: false
  alias Ecto.Multi

  alias Thexr.Repo

  alias Thexr.Spaces.Space
  alias Thexr.Spaces.Entity
  alias Thexr.Spaces.Treepath

  @doc """
  Returns the list of spaces.

  ## Examples

      iex> list_spaces()
      [%Space{}, ...]

  """
  def list_spaces do
    Repo.all(Space)
  end

  @doc """
  Gets a single space.

  Raises `Ecto.NoResultsError` if the Space does not exist.

  ## Examples

      iex> get_space!(123)
      %Space{}

      iex> get_space!(456)
      ** (Ecto.NoResultsError)

  """
  def get_space!(id), do: Repo.get!(Space, id)

  def get_space_by_slug(slug), do: Repo.get_by(Space, slug: slug)

  def get_all_entities_for_space(space_id) do
    q = from(e in Entity, where: e.space_id == ^space_id, order_by: e.inserted_at)
    Repo.all(q)
  end

  def get_space_with_top_level_entities!(id) do
    space = Repo.get!(Space, id)
    Map.merge(space, %{:entities => get_space_top_level_entities!(id)})
  end

  # returns tops level entities for a space without returning the space
  def get_space_top_level_entities!(id) do
    q1 = from(e in Entity, where: is_nil(e.parent_id) and e.space_id == ^id)
    Repo.all(q1)
  end

  # about querying entity tree for editing

  def entity_tree_flat(space_id, []) do
    get_space_top_level_entities!(space_id)
  end

  def entity_tree_flat(space_id, list_of_expanded_entity_ids) do
    q =
      from(e in Entity,
        where:
          is_nil(e.parent_id) or
            (e.parent_id in ^list_of_expanded_entity_ids and e.space_id == ^space_id)
      )

    Repo.all(q) || []
  end

  def entity_tree_nested(space_id, :full) do
    flat_list = get_all_entities_for_space(space_id) || []
    parent_map = create_parent_map(flat_list)
    nest_entities(parent_map[nil], parent_map)
  end

  def entity_tree_nested(space_id, list_of_expanded_entity_ids) do
    flat_list = entity_tree_flat(space_id, list_of_expanded_entity_ids) || []
    # create a dictionary of parent_ids -> to their children
    parent_map = create_parent_map(flat_list)

    nest_entities(parent_map[nil], parent_map)
  end

  def nest_entities(nil, _) do
    []
  end

  def nest_entities(list, map) do
    Enum.map(list, fn node ->
      if Map.has_key?(map, node.id) do
        Map.merge(node, %{children: nest_entities(map[node.id], map)})
      else
        node
      end
    end)
  end

  defp create_parent_map(flat_list) do
    Enum.reduce(
      flat_list,
      %{},
      fn entity, acc ->
        if Map.has_key?(acc, entity.parent_id) do
          Map.merge(acc, %{entity.parent_id => [entity | acc[entity.parent_id]]})
        else
          Map.merge(acc, %{entity.parent_id => [entity]})
        end
      end
    )
  end

  @doc """
  Creates a space.

  ## Examples

      iex> create_space(%{field: value})
      {:ok, %Space{}}

      iex> create_space(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_space(attrs \\ %{}) do
    %Space{}
    |> Space.new_changeset(attrs)
    |> Space.create_rand_slug_if_missing()
    |> Repo.insert()
  end

  @doc """
  Updates a space.

  ## Examples

      iex> update_space(space, %{field: new_value})
      {:ok, %Space{}}

      iex> update_space(space, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_space(%Space{} = space, attrs) do
    space
    |> Space.edit_changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a space.

  ## Examples

      iex> delete_space(space)
      {:ok, %Space{}}

      iex> delete_space(space)
      {:error, %Ecto.Changeset{}}

  """
  def delete_space(%Space{} = space) do
    Repo.delete(space)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking space changes.

  ## Examples

      iex> change_space(space)
      %Ecto.Changeset{data: %Space{}}

  """
  def change_space(%Space{} = space, attrs \\ %{}) do
    Space.new_changeset(space, attrs)
  end

  alias Thexr.Spaces.Entity

  @doc """
  Returns the list of entities.

  ## Examples

      iex> list_entities()
      [%Entity{}, ...]

  """
  def list_entities do
    Repo.all(Entity)
  end

  def list_entities_for_space_with_components(space_id) do
    query = from(e in Entity, where: e.space_id == ^space_id)
    entities = Repo.all(query)
    entities |> Repo.preload(:components)
  end

  @doc """
  Gets a single entity.

  Raises `Ecto.NoResultsError` if the Entity does not exist.

  ## Examples

      iex> get_entity!(123)
      %Entity{}

      iex> get_entity!(456)
      ** (Ecto.NoResultsError)

  """
  def get_entity!(id), do: Repo.get!(Entity, id)

  @doc """
  Creates a entity.

  ## Examples

      iex> create_entity(%{field: value})
      {:ok, %Entity{}}

      iex> create_entity(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_entity(attrs \\ %{}) do
    attrs = Entity.build_default_components(attrs)

    changeset =
      %Entity{}
      |> Entity.changeset(attrs)

    {:ok, %{entity: entity}} =
      Multi.new()
      |> Multi.insert(:entity, changeset)
      |> Repo.transaction()

    {:ok, entity}
    # case result do
    #   {:ok, entity} ->
    #     Repo.insert_all(Treepath, [%{ancestor_id: entity.id, descendant_id: entity.id}])
    #     {:ok, entity}

    #   result ->
    #     result
    # end
  end

  @doc """
  Updates a entity.

  ## Examples

      iex> update_entity(entity, %{field: new_value})
      {:ok, %Entity{}}

      iex> update_entity(entity, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_entity(%Entity{} = entity, attrs) do
    entity
    |> Entity.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a entity.

  ## Examples

      iex> delete_entity(entity)
      {:ok, %Entity{}}

      iex> delete_entity(entity)
      {:error, %Ecto.Changeset{}}

  """
  def delete_entity(%Entity{} = entity) do
    Repo.delete(entity)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking entity changes.

  ## Examples

      iex> change_entity(entity)
      %Ecto.Changeset{data: %Entity{}}

  """
  def change_entity(%Entity{} = entity, attrs \\ %{}) do
    Entity.changeset(entity, attrs)
  end

  # 3 operations

  def parent_entity(child_id, new_parent_id) do
    case entity_has_ancestor?(new_parent_id, child_id) do
      {true, _} ->
        false

      _ ->
        unparent_entity(child_id, new_parent_id)

        # set parent_id on entity record
        Entity.setparent_changeset(%Entity{id: child_id}, new_parent_id)
        |> Repo.update()

        # increment child_count on the new parent
        query = from(e in Entity, update: [inc: [child_count: 1]], where: e.id == ^new_parent_id)
        query |> Repo.update_all([])

        # https://www.percona.com/blog/2011/02/14/moving-subtrees-in-closure-table/
        # now we need to insert all the nodes of the subtree.
        # We use a Cartesian join between the ancestors (going up) and the descendants (going down).
        insert_tree_query = """
        INSERT into treepaths (ancestor_id, descendant_id, depth)
        SELECT supertree.ancestor_id, subtree.descendant_id,
        supertree.depth+subtree.depth+1
        FROM treepaths AS supertree CROSS JOIN treepaths AS subtree
        WHERE subtree.ancestor_id = $1
        AND supertree.descendant_id = $2
        """

        Ecto.Adapters.SQL.query!(
          Repo,
          insert_tree_query,
          [Ecto.UUID.dump!(child_id), Ecto.UUID.dump!(new_parent_id)]
        )

        true
    end
  end

  # move to new parent version (just avoids unsetting parent_id on entity)
  def unparent_entity(child_id, _new_parent) do
    # get the parent_id
    query =
      from e in Entity,
        select: e.parent_id,
        where: not is_nil(e.parent_id) and e.id == ^child_id

    case Repo.all(query) do
      [] ->
        "no-op"

      [parent_id] ->
        query = from(e in Entity, update: [inc: [child_count: -1]], where: e.id == ^parent_id)
        query |> Repo.update_all([])
    end

    # remove any tree paths in my descendants https://www.percona.com/blog/2011/02/14/moving-subtrees-in-closure-table/
    # essentially breaking the subtree away
    Ecto.Adapters.SQL.query(
      Repo,
      "delete from treepaths where descendant_id in (select descendant_id from treepaths where ancestor_id = $1) and ancestor_id not in (select descendant_id from treepaths where ancestor_id = $1)",
      [Ecto.UUID.dump!(child_id)]
    )
  end

  # stand alone version
  def unparent_entity(child_id) do
    unparent_entity(child_id, :move)

    Entity.unsetparent_changeset(%Entity{id: child_id})
    |> Repo.update()
  end

  def entity_has_ancestor?(test_child_id, test_ancestor_id) do
    query =
      from(t in Treepath,
        select: t.depth,
        where: t.descendant_id == ^test_child_id and t.ancestor_id == ^test_ancestor_id
      )

    case Repo.all(query) do
      [] -> {false, nil}
      [depth] -> {true, depth}
    end
  end

  def get_children_entities_of_entity_by_id(id) do
    q = from(e in Entity, where: e.parent_id == ^id)
    Repo.all(q)
  end

  alias Thexr.Spaces.Component

  @doc """
  Returns the list of components.

  ## Examples

      iex> list_components()
      [%Component{}, ...]

  """
  def list_components do
    Repo.all(Component)
  end

  def list_component_types do
    ["position"]
  end

  def list_components_for_entity(entity_id) do
    query = from(c in Component, where: c.entity_id == ^entity_id)
    Repo.all(query)
  end

  @doc """
  Gets a single component.

  Raises `Ecto.NoResultsError` if the Component does not exist.

  ## Examples

      iex> get_component!(123)
      %Component{}

      iex> get_component!(456)
      ** (Ecto.NoResultsError)

  """
  def get_component!(id), do: Repo.get!(Component, id)

  @doc """
  Creates a component.

  ## Examples

      iex> create_component(%{field: value})
      {:ok, %Component{}}

      iex> create_component(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """

  # def create_component(attrs \\ %{}) do
  #   %Component{}
  #   |> Component.changeset(attrs)
  #   |> Repo.insert()
  # end

  def create_component_for_entity(entity_id, component_type, attrs \\ %{}) do
    attrs = %{"type" => component_type, "data" => Map.put(attrs, "__type__", component_type)}

    %Component{entity_id: entity_id}
    |> Component.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a component.

  ## Examples

      iex> update_component(component, %{field: new_value})
      {:ok, %Component{}}

      iex> update_component(component, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_component(%Component{} = component, attrs) do
    component
    |> Component.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a component.

  ## Examples

      iex> delete_component(component)
      {:ok, %Component{}}

      iex> delete_component(component)
      {:error, %Ecto.Changeset{}}

  """
  def delete_component(%Component{} = component) do
    Repo.delete(component)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking component changes.

  ## Examples

      iex> change_component(component)
      %Ecto.Changeset{data: %Component{}}

  """
  def change_component(%Component{} = component, attrs \\ %{}) do
    Component.changeset(component, attrs)
  end

  alias Thexr.Spaces.Plugin

  @doc """
  Returns the list of plugins.

  ## Examples

      iex> list_plugins()
      [%Plugin{}, ...]

  """
  def list_plugins do
    Repo.all(Plugin)
  end

  @doc """
  Gets a single plugin.

  Raises `Ecto.NoResultsError` if the Plugin does not exist.

  ## Examples

      iex> get_plugin!(123)
      %Plugin{}

      iex> get_plugin!(456)
      ** (Ecto.NoResultsError)

  """
  def get_plugin!(id), do: Repo.get!(Plugin, id)

  @doc """
  Creates a plugin.

  ## Examples

      iex> create_plugin(%{field: value})
      {:ok, %Plugin{}}

      iex> create_plugin(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_plugin(attrs \\ %{}) do
    %Plugin{}
    |> Plugin.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a plugin.

  ## Examples

      iex> update_plugin(plugin, %{field: new_value})
      {:ok, %Plugin{}}

      iex> update_plugin(plugin, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_plugin(%Plugin{} = plugin, attrs) do
    plugin
    |> Plugin.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a plugin.

  ## Examples

      iex> delete_plugin(plugin)
      {:ok, %Plugin{}}

      iex> delete_plugin(plugin)
      {:error, %Ecto.Changeset{}}

  """
  def delete_plugin(%Plugin{} = plugin) do
    Repo.delete(plugin)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking plugin changes.

  ## Examples

      iex> change_plugin(plugin)
      %Ecto.Changeset{data: %Plugin{}}

  """
  def change_plugin(%Plugin{} = plugin, attrs \\ %{}) do
    Plugin.changeset(plugin, attrs)
  end

  alias Thexr.Spaces.Template

  @doc """
  Returns the list of templates.

  ## Examples

      iex> list_templates()
      [%Template{}, ...]

  """
  def list_templates do
    Repo.all(Template)
  end

  @doc """
  Gets a single template.

  Raises `Ecto.NoResultsError` if the Template does not exist.

  ## Examples

      iex> get_template!(123)
      %Template{}

      iex> get_template!(456)
      ** (Ecto.NoResultsError)

  """
  def get_template!(id), do: Repo.get!(Template, id)

  @doc """
  Creates a template.

  ## Examples

      iex> create_template(%{field: value})
      {:ok, %Template{}}

      iex> create_template(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_template(attrs \\ %{}) do
    %Template{}
    |> Template.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a template.

  ## Examples

      iex> update_template(template, %{field: new_value})
      {:ok, %Template{}}

      iex> update_template(template, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_template(%Template{} = template, attrs) do
    template
    |> Template.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a template.

  ## Examples

      iex> delete_template(template)
      {:ok, %Template{}}

      iex> delete_template(template)
      {:error, %Ecto.Changeset{}}

  """
  def delete_template(%Template{} = template) do
    Repo.delete(template)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking template changes.

  ## Examples

      iex> change_template(template)
      %Ecto.Changeset{data: %Template{}}

  """
  def change_template(%Template{} = template, attrs \\ %{}) do
    Template.changeset(template, attrs)
  end

  # Serializing

  def serialize(space) do
    entities = list_entities_for_space_with_components(space.id)

    %{entities: entities, slug: space.slug}
    |> Jason.encode!()
  end
end
