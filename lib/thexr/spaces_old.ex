defmodule Thexr.SpacesOld do
  @moduledoc """
  The Spaces context.
  """

  import Ecto.Query, warn: false
  alias Ecto.Multi

  alias Thexr.Repo

  alias Thexr.Spaces.Space
  alias Thexr.Spaces.{Entity, Component, NavMesh}
  alias Thexr.Spaces.Treepath

  @doc """
  Returns the list of spaces.

  ## Examples

      iex> list_spaces()
      [%Space{}, ...]

  """
  def list_spaces do
    query = from Space, order_by: [desc: :inserted_at]
    Repo.all(query)
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

  @spec get_space_by_id(any) :: any
  def get_space_by_id(id) do
    Repo.get(Space, id)
  end

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

  def find_and_nudge_space(space_id) do
    case get_space_by_id(space_id) do
      nil ->
        nil

      space ->
        nudge_space(space)
        space
    end
  end

  def nudge_space(space_or_id) do
    Thexr.SpaceSupervisor.start_space(space_or_id)
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
    |> Space.create_settings_if_missing()
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
    |> broadcast_space_update()
  end

  defp broadcast_space_update({:ok, space}) do
    ThexrWeb.Endpoint.broadcast("space:#{space.id}", "space_settings_changed", space.settings)
    {:ok, space}
  end

  defp broadcast_space_update(other) do
    other
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
    entities |> Repo.preload(components: from(c in Component, order_by: c.type))
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

  def get_entity_by_id(id), do: Repo.get(Entity, id)

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

  def entity_count(space_id) do
    q = from e in Entity, select: count("*"), where: e.space_id == ^space_id
    Repo.one(q)
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
  """
  def delete_entity(filters) do
    entity = Repo.get_by(Entity, filters)
    Repo.delete(entity)
  end

  def delete_entity_with_broadcast(space, %{"id" => entity_id}) do
    delete_entity_with_broadcast(space, id: entity_id)
  end

  def delete_entity_with_broadcast(space, filters) do
    filters = filters ++ [{:space_id, space.id}]

    with {:ok, entity} <- delete_entity(filters) do
      ThexrWeb.Endpoint.broadcast(
        "space:#{space.id}",
        "entity_deleted",
        %{id: entity.id}
      )

      {:ok, entity}
    else
      err -> err
    end
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

  def get_component_by_entity_id(entity_id, type) do
    case Repo.get_by(Component, entity_id: entity_id, type: type) do
      nil -> {:error, :not_found}
      component -> {:ok, component}
    end
  end

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

  # Serializing

  def serialize(space) do
    entities = list_entities_for_space_with_components(space.id)

    %{entities: entities, id: space.id, settings: space.settings}
    |> Jason.encode!()
  end

  # when entity is precreated in frontend
  def added_entity_with_broadcast(space, uuid, name, entity_kind, components) do
    attrs = %{"space_id" => space.id, "type" => entity_kind, "id" => uuid, "name" => name}
    attrs = Entity.set_components_in_attrs(attrs, components)
    {:ok, entity} = create_entity(attrs)

    entity = entity |> Repo.preload(components: from(c in Component, order_by: c.type))

    ThexrWeb.Endpoint.broadcast(
      "space:#{space.id}",
      "entity_created",
      entity
    )

    {:ok, entity}
  end

  def add_entity_with_broadcast(space, entity_kind) do
    attrs = %{"space_id" => space.id, "type" => entity_kind}
    {:ok, entity} = create_entity(attrs)
    entity = entity |> Repo.preload(components: from(c in Component, order_by: c.type))

    ThexrWeb.Endpoint.broadcast(
      "space:#{space.id}",
      "entity_created",
      entity
    )

    {:ok, entity}
  end

  def modify_component_with_broadcast(space, entity_id, type, data) do
    with {:ok, component} <- get_component_by_entity_id(entity_id, type),
         {:ok, component} <-
           Component.changeset(component, %{"type" => type, "data" => data}) |> Repo.update() do
      ThexrWeb.Endpoint.broadcast("space:#{space.id}", "component_changed", %{
        "entity_id" => component.entity_id,
        "type" => component.type,
        "data" => component.data
      })

      {:ok, component}
    else
      # TODO do multiple error values match here?  Pls check
      {:error, :not_found} -> create_component_for_entity(entity_id, type, data)
      err -> err
    end
  end

  alias Thexr.Spaces.EventStream

  @doc """
  Returns the list of events.

  ## Examples

      iex> list_events()
      [%Event{}, ...]

  """
  @event_stream_defaults %{last_evaluated_sequence: 0, limit: 100}

  def get_event_stream(space_id, options \\ []) do
    %{last_evaluated_sequence: last_evaluated_sequence, limit: limit} =
      Enum.into(options, @event_stream_defaults)

    q =
      from(e in EventStream,
        select: map(e, [:sequence, :event]),
        where: e.space_id == ^space_id and e.sequence > ^last_evaluated_sequence,
        limit: ^limit,
        order_by: e.sequence
      )

    Repo.all(q)
  end

  def delete_event_stream(space_id) do
    q = from(e in EventStream, where: e.space_id == ^space_id)
    Repo.delete_all(q)
  end

  @doc """
  Creates a event.

  ## Examples

      iex> create_event(%{field: value})
      {:ok, %Event{}}

      iex> create_event(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_event(attrs \\ %{}) do
    %EventStream{}
    |> EventStream.changeset(attrs)
    |> Repo.insert()
  end

  # def set_max_event_sequence(space_id, max_sequence) do
  #   query =
  #     from(s in Space, update: [set: [max_sequence: ^max_sequence]], where: s.id == ^space_id)

  #   Repo.update_all(query, [])
  # end

  def max_event_sequence(space_id) do
    # query = from s in Space, select: s.max_sequence, where: s.id == ^space_id
    # Repo.one(query) || 0

    query = from e in EventStream, select: max(e.sequence), where: e.space_id == ^space_id
    Repo.one(query) || 0
  end

  # given the batch name 1-100, 101-200 etc, fetch the archive data from s3 if it was archived
  def batch_fetch_eventstream_from_s3(space_id, batch_name, client) do
    case AWS.S3.get_object(
           client,
           "thexr-eventstream-archive",
           "#{space_id}/#{batch_name}"
         ) do
      {:ok, _, result} ->
        Jason.decode!(result.body)
        |> Enum.map(fn event_stream ->
          %{event: event_stream["event"], sequence: event_stream["sequence"]}
        end)

      {:error, _} ->
        []
    end
  end

  # when seeing the 'last' sequence of modulo 100, backup the
  # previous 1-100, 101-200, etc to s3, then free the records from postgres
  def batch_archive_eventstream_to_s3(space_id, sequence, client) do
    query =
      from e in EventStream,
        select: map(e, [:sequence, :event]),
        where: e.space_id == ^space_id and e.sequence <= ^sequence,
        order_by: e.sequence

    body = Repo.all(query) |> Jason.encode!()

    case AWS.S3.put_object(
           client,
           "thexr-eventstream-archive",
           "#{space_id}/#{sequence - 99}-#{sequence}",
           %{
             "Body" => body,
             "ContentType" => "application/json"
           }
         ) do
      {:ok, _, _} ->
        query =
          from e in EventStream,
            where: e.space_id == ^space_id and e.sequence <= ^sequence

        Repo.delete_all(query)
    end
  end

  # gets the event stream first from DB then from S3 if doesn't exist in DB
  def event_stream(space_id, last_evaluated_sequence) do
    max_seq = max_event_sequence(space_id)
    # any sequence between these two numbers hasn't been archived yet
    current_page_max = upper_bound(max_seq)
    current_page_min = lower_bound(max_seq)
    seq_page_max = upper_bound(last_evaluated_sequence + 1)
    seq_page_min = lower_bound(last_evaluated_sequence + 1)

    cond do
      last_evaluated_sequence >= max_seq ->
        []

      last_evaluated_sequence + 1 >= current_page_min &&
          last_evaluated_sequence + 1 <= current_page_max ->
        # potentially in the DB or being uploaded now... tricky race condition here
        get_event_stream(space_id, last_evaluated_sequence: last_evaluated_sequence)

      last_evaluated_sequence < current_page_min ->
        # probably uploaded to s3
        batch_name = "#{seq_page_min}-#{seq_page_max}" |> IO.inspect(label: "batch_name")
        client = AWS.Client.create()

        result =
          batch_fetch_eventstream_from_s3(
            space_id,
            batch_name,
            client
          )

        # don't return sequences earlier than what we're asking for
        Enum.reduce_while(result, result, fn e, acc ->
          if e.sequence <= last_evaluated_sequence do
            [_ | rest] = acc
            {:cont, rest}
          else
            {:halt, acc}
          end
        end)
    end
  end

  def upper_bound(sequence) do
    bucket_place = Float.floor(sequence / 100)

    cond do
      rem(sequence, 100) == 0 -> sequence |> trunc()
      true -> ((bucket_place + 1) * 100) |> trunc()
    end
  end

  def lower_bound(sequence) do
    bucket_place = Float.floor(sequence / 100)

    cond do
      rem(sequence, 100) == 0 -> (sequence - 99) |> trunc()
      true -> ((bucket_place + 1) * 100 - 99) |> trunc()
    end
  end

  def delete_nav_mesh(space_id) do
    query = from n in NavMesh, where: n.space_id == ^space_id
    Repo.delete_all(query)
  end

  def set_nav_mesh(space_id, data) do
    # upsert nav mesh
    Repo.insert!(
      %NavMesh{space_id: space_id, data: data},
      on_conflict: [set: [data: data]],
      conflict_target: :space_id
    )
  end

  def get_nav_mesh(space_id) do
    query =
      from n in NavMesh,
        select: n.data,
        where: n.space_id == ^space_id

    Repo.one(query)
  end
end
