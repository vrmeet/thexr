defmodule Thexr.Spaces do
  @moduledoc """
  The Spaces context.
  """

  import Ecto.Query, warn: false
  alias Thexr.Repo

  alias Thexr.Spaces.Space
  alias Thexr.Spaces.Entity

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

  def get_all_entities_for_space(space_id) do
    q = from(e in Entity, where: e.space_id == ^space_id)
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
    |> Space.changeset(attrs)
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
    |> Space.changeset(attrs)
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
    Space.changeset(space, attrs)
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
    %Entity{}
    |> Entity.changeset(attrs)
    |> Repo.insert()
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

  def parent_entity(child_id, new_parent_id) do
    Entity.setparent_changeset(%Entity{id: child_id}, new_parent_id)
    |> Repo.update()

    query = from(e in Entity, update: [inc: [child_count: 1]], where: e.id == ^new_parent_id)
    query |> Repo.update_all([])
  end

  def unparent_entity(child_id) do
    q1 = from(e in Entity, select: [:parent_id], where: e.id == ^child_id)
    entity = Repo.one(q1)

    if entity && entity.parent_id do
      query =
        from(e in Entity, update: [inc: [child_count: -1]], where: e.id == ^entity.parent_id)

      query |> Repo.update_all([])

      Entity.unsetparent_changeset(%Entity{id: child_id})
      |> Repo.update()
    end
  end

  def get_children_entities_of_entity_by_id(id) do
    q = from(e in Entity, where: e.parent_id == ^id)
    Repo.all(q)
  end
end
