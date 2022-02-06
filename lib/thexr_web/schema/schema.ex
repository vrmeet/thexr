defmodule ThexrWeb.Schema.Schema do
  use Absinthe.Schema

  alias ThexrWeb.Resolvers.SpaceResolver

  object :space do
    field :id, non_null(:id)
    field :slug, non_null(:string)
    field :description, non_null(:string)
  end

  query do
    @desc "Get all spaces"
    field :spaces, non_null(list_of(non_null(:space))) do
      resolve(&SpaceResolver.spaces/3)
    end
  end
end
