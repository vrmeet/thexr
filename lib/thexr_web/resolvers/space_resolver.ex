defmodule ThexrWeb.Resolvers.SpaceResolver do
  alias Thexr.Spaces

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
      nil -> {:error, :space_not_found}
      space -> Spaces.add_entity_with_broadcast(space, args.type)
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
end
