defmodule ThexrWeb.Resolvers.SpaceResolver do
  alias Thexr.Spaces

  def spaces(_root, _args, _info) do
    {:ok, Spaces.list_spaces()}
  end

  def space(_root, %{space_id: space_id}, _info) do
    case Spaces.find_and_nudge_space(space_id) do
      nil -> {:error, :not_found}
      {:ok, space, _} -> {:ok, space}
    end
  end

  # def event_stream(
  #       _root,
  #       %{space_id: space_id, last_evaluated_sequence: last_evaluated_sequence},
  #       _info
  #     ) do
  #   events = Spaces.event_stream(space_id, last_evaluated_sequence)
  #   {:ok, events}
  # end

  # def event_stream(
  #       _root,
  #       %{space_id: space_id},
  #       _info
  #     ) do
  #   events = Spaces.event_stream(space_id, 0)
  #   {:ok, events}
  # end

  # def components(_, args, _) do
  #   {:ok, Spaces.list_components_for_entity(args.entity_id)}
  # end

  # def create_entity(_root, %{space_id: space_id, type: type}, _) do
  #   case Spaces.find_and_nudge_space(space_id) do
  #     nil ->
  #       {:error, :space_not_found}

  #     space ->
  #       Thexr.Spaces.CommandHandler.create_entity(space.id, type)
  #   end
  # end

  # def create_box(_root, %{space_id: space_id} = args, _) do
  #   case Spaces.find_and_nudge_space(space_id) do
  #     nil ->
  #       {:error, :space_not_found}

  #     space ->
  #       params = Map.delete(args, :space_id) |> Map.to_list()

  #       Thexr.Spaces.CommandHandler.create_entity(space.id, "box", params)
  #   end
  # end

  # def create_wall(_root, %{space_id: space_id} = args, _) do
  #   case Spaces.find_and_nudge_space(space_id) do
  #     nil ->
  #       {:error, :space_not_found}

  #     space ->
  #       params = Map.delete(args, :space_id) |> Map.to_list()

  #       Thexr.Spaces.CommandHandler.create_entity(space.id, "wall", params)
  #   end
  # end

  # def create_enemy_spawner(_root, %{space_id: space_id} = args, _) do
  #   case Spaces.find_and_nudge_space(space_id) do
  #     nil ->
  #       {:error, :space_not_found}

  #     space ->
  #       params = Map.delete(args, :space_id) |> Map.to_list()
  #       Thexr.Spaces.CommandHandler.create_entity(space.id, "enemy_spawner", params)
  #   end
  # end

  # def delete_entity(_root, %{space_id: space_id, entity_id: entity_id}, _) do
  #   case Spaces.find_and_nudge_space(space_id) do
  #     nil ->
  #       {:error, :space_not_found}

  #     space ->
  #       case Spaces.get_entity_by_id(entity_id) do
  #         nil ->
  #           {:error, :entity_not_found}

  #         entity ->
  #           Thexr.Spaces.CommandHandler.delete_entity(space.id, entity.id)
  #           {:ok, true}
  #       end
  #   end
  # end

  # def translate_entity(_root, %{space_id: space_id, entity_id: entity_id, position: position}, _) do
  #   case Spaces.find_and_nudge_space(space_id) do
  #     nil ->
  #       {:error, :space_not_found}

  #     space ->
  #       case Spaces.get_entity_by_id(entity_id) do
  #         nil ->
  #           {:error, :entity_not_found}

  #         entity ->
  #           Thexr.Spaces.CommandHandler.transform_entity(space.id, entity.id, [
  #             %{"type" => "position", "data" => %{"value" => position}}
  #           ])

  #           {:ok, true}
  #       end
  #   end
  # end

  # def rotate_entity(_root, %{space_id: space_id, entity_id: entity_id, rotation: rotation}, _) do
  #   case Spaces.find_and_nudge_space(space_id) do
  #     nil ->
  #       {:error, :space_not_found}

  #     space ->
  #       case Spaces.get_entity_by_id(entity_id) do
  #         nil ->
  #           {:error, :entity_not_found}

  #         entity ->
  #           Thexr.Spaces.CommandHandler.transform_entity(space.id, entity.id, [
  #             %{"type" => "rotation", "data" => %{"value" => rotation}}
  #           ])

  #           {:ok, true}
  #       end
  #   end
  # end

  # def scale_entity(_root, %{space_id: space_id, entity_id: entity_id, scaling: scaling}, _) do
  #   case Spaces.find_and_nudge_space(space_id) do
  #     nil ->
  #       {:error, :space_not_found}

  #     space ->
  #       case Spaces.get_entity_by_id(entity_id) do
  #         nil ->
  #           {:error, :entity_not_found}

  #         entity ->
  #           Thexr.Spaces.CommandHandler.transform_entity(space.id, entity.id, [
  #             %{"type" => "scaling", "data" => %{"value" => scaling}}
  #           ])

  #           {:ok, true}
  #       end
  #   end
  # end

  # def color_entity(_root, %{space_id: space_id, entity_id: entity_id, color: color}, _) do
  #   case Spaces.find_and_nudge_space(space_id) do
  #     nil ->
  #       {:error, :space_not_found}

  #     space ->
  #       case Spaces.get_entity_by_id(entity_id) do
  #         nil ->
  #           {:error, :entity_not_found}

  #         entity ->
  #           Thexr.Spaces.CommandHandler.color_entity(space.id, entity.id, color)
  #           {:ok, true}
  #       end
  #   end
  # end

  # def update_space(_, %{space_id: space_id, attributes: attributes}, _) do
  #   case Spaces.find_and_nudge_space(space_id) do
  #     nil ->
  #       {:error, :space_not_found}

  #     space ->
  #       attributes =
  #         cond do
  #           Map.has_key?(attributes, :settings) ->
  #             Map.put(
  #               attributes,
  #               :settings,
  #               space.settings |> Map.from_struct() |> Map.merge(attributes.settings)
  #             )

  #           true ->
  #             attributes
  #         end

  #       Spaces.update_space(space, attributes)
  #   end
  # end

  # def playback(_root, args, _) do
  #   Thexr.PlaybackServer.start_link(args)
  #   {:ok, true}
  # end
end
