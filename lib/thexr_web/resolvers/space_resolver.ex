defmodule ThexrWeb.Resolvers.SpaceResolver do
  alias Thexr.Spaces

  def spaces(_root, _args, _info) do
    {:ok, Spaces.list_spaces()}
  end

  def space(_root, args, _info) do
    {:ok, Spaces.get_space_by_slug(args.slug)}
  end

  def components(_, args, _) do
    {:ok, Spaces.list_components_for_entity(args.entity_id)}
  end
end
