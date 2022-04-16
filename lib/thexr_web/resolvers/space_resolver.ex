defmodule ThexrWeb.Resolvers.SpaceResolver do
  alias Thexr.Spaces
  alias Thexr.Spaces.EventStream

  def spaces(_root, _args, _info) do
    {:ok, Spaces.list_spaces()}
  end

  def space(_root, %{space_id: space_id}, _info) do
    case Spaces.get_space_by_id(space_id) do
      nil -> {:error, :not_found}
      space -> {:ok, space}
    end
  end

  def event_stream(_root, %{space_id: space_id} = args, _info) do
    options = args |> Enum.into([]) |> Keyword.drop([:space_id])
    events = Spaces.event_stream(space_id, options)
    {:ok, events}
  end

  # def components(_, args, _) do
  #   {:ok, Spaces.list_components_for_entity(args.entity_id)}
  # end

  def create_entity(_root, %{space_id: space_id, type: type}, _) do
    case Spaces.get_space_by_id(space_id) do
      nil ->
        {:error, :space_not_found}

      space ->
        Thexr.Spaces.CommandHandler.create_entity(space.id, type)
    end
  end

  def delete_entity(_root, %{space_id: space_id, entity_id: entity_id}, _) do
    case Spaces.get_space_by_id(space_id) do
      nil ->
        {:error, :space_not_found}

      space ->
        case Spaces.get_entity_by_id(entity_id) do
          nil ->
            {:error, :entity_not_found}

          entity ->
            Thexr.Spaces.CommandHandler.delete_entity(space.id, entity.id)
            {:ok, true}
        end
    end
  end

  def update_space(_, %{space_id: space_id, attributes: attributes}, _) do
    case Spaces.get_space_by_id(space_id) do
      nil ->
        {:error, :space_not_found}

      space ->
        attributes =
          cond do
            Map.has_key?(attributes, :settings) ->
              Map.put(
                attributes,
                :settings,
                space.settings |> Map.from_struct() |> Map.merge(attributes.settings)
              )

            true ->
              attributes
          end

        Spaces.update_space(space, attributes)
    end
  end

  def playback(_root, args, _) do
    Thexr.PlaybackServer.start_link(args)
    {:ok, true}
  end
end
