defmodule ThexrWeb.Resolvers.SpaceResolver do
  alias Thexr.Spaces
  alias Thexr.SpaceServer
  alias Thexr.SpaceSupervisor

  def spaces(_root, _args, _info) do
    {:ok, Spaces.list_spaces()}
  end

  def space(_root, args, _info) do
    {:ok, Spaces.get_space_by_slug(args.slug)}
  end

  # def components(_, args, _) do
  #   {:ok, Spaces.list_components_for_entity(args.entity_id)}
  # end

  def create_entity(_root, args, _) do
    case Spaces.get_space_by_slug(args.slug) do
      nil ->
        {:error, :space_not_found}

      _space ->
        id = Ecto.UUID.generate()

        payload = %{
          "m" => "entity_created",
          "p" => %{
            "type" => args.type,
            "id" => id,
            name: "#{args.type}_#{Thexr.Utils.random_id(5)}",
            components: [
              %{"type" => "position", "data" => [0, 0, 0]},
              %{"type" => "rotation", "data" => [0, 0, 0]},
              %{"type" => "scaling", "data" => [1, 1, 1]}
            ]
          },
          "ts" => :os.system_time(:millisecond)
        }

        SpaceServer.process_event(args.slug, payload, nil)
        {:ok, id}
        # Spaces.add_entity_with_broadcast(space, args.type)
    end
  end

  def delete_entity(_root, args, _) do
    case Spaces.get_space_by_slug(args.slug) do
      nil ->
        {:error, :space_not_found}

      space ->
        with {:ok, entity} <- Spaces.delete_entity_with_broadcast(space, name: args.name) do
          {:ok, entity.id}
        else
          err -> {:error, err}
        end
    end
  end

  def update_space(_, args, _) do
    space = Spaces.get_space_by_slug(args.slug)

    attributes =
      cond do
        Map.has_key?(args.attributes, :settings) ->
          Map.put(
            args.attributes,
            :settings,
            space.settings |> Map.from_struct() |> Map.merge(args.attributes.settings)
          )

        true ->
          args.attributes
      end

    Spaces.update_space(space, attributes)
  end
end
