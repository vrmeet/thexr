defmodule ThexrWeb.Schema.Schema do
  use Absinthe.Schema

  import_types(Thexr.Schema.Types.Custom.JSON)

  alias ThexrWeb.Resolvers.SpaceResolver

  object :space do
    field :id, non_null(:id)
    field :slug, non_null(:string)
    field :description, non_null(:string)
    field :settings, :json
    field :entities, non_null(list_of(:entity))
  end

  # object :settings do
  #   field :use_skybox, non_null(:boolean)
  #   field :skybox_inclination, non_null(:float)
  #   field :clear_color, non_null(:string)
  #   field :fog_color, non_null(:string)
  #   field :fog_density, non_null(:float)
  # end

  object :entity do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :type, non_null(:string)
    field :space_id, non_null(:id)
    field :parent_id, :id

    # has_many :components, Thexr.Spaces.Component
  end

  object :component do
    field :id, non_null(:id)
    field :entity_id, non_null(:id)
    field :type, non_null(:string)
    field :data, :json
  end

  query do
    @desc "Get all spaces"
    field :spaces, non_null(list_of(non_null(:space))) do
      resolve(&SpaceResolver.spaces/3)
    end

    # Add this field:
    @desc "Get a space using the slug"
    field :space, :space do
      arg(:slug, non_null(:string))
      resolve(&SpaceResolver.space/3)
    end

    # field :components, list_of(:component) do
    #   arg(:entity_id, non_null(:id))
    #   resolve(&SpaceResolver.components/3)
    # end
  end
end
