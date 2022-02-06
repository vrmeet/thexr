defmodule ThexrWeb.Resolvers.SpaceResolver do
  alias Thexr.Spaces

  def spaces(_root, _args, _info) do
    {:ok, Spaces.list_spaces()}
  end
end
