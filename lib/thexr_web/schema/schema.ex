defmodule ThexrWeb.Schema.Schema do
  use Absinthe.Schema
  import Absinthe.Resolution.Helpers, only: [dataloader: 1, dataloader: 3]

  import_types(Thexr.Schema.Types.Custom.JSON)

  alias ThexrWeb.Resolvers.SpaceResolver
  alias Thexr.Spaces

  object :space do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :slug, non_null(:string)
    field :description, :string
    field :settings, :json
    field :entities, non_null(list_of(:entity)), resolve: dataloader(Spaces)
  end

  input_object :space_input do
    field :slug, :string
    field :name, :string
    field :description, :string
    field :settings, :settings_input
  end

  input_object :settings_input do
    field :use_skybox, :boolean
    field :skybox_inclination, :float
    field :clear_color, :string
    field :fog_color, :string
    field :fog_density, :float
  end

  object :entity do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :type, non_null(:string)
    field :space_id, non_null(:id)
    field :parent_id, :id
    field :components, non_null(list_of(:component)), resolve: dataloader(Spaces)

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

  mutation do
    @desc "update  a space"
    field :update_space, :id do
      arg(:slug, non_null(:string))
      arg(:attributes, non_null(:space_input))
      resolve(&SpaceResolver.update_space/3)
    end

    @desc "create entity for a space"
    field :create_entity, :id do
      arg(:slug, non_null(:string))
      arg(:type, non_null(:string))
      resolve(&SpaceResolver.create_entity/3)
    end

    @desc "delete an entity from a space"
    field :delete_entity, :id do
      @desc "the slug of the space"
      arg(:slug, non_null(:string))
      @desc "the id of the entity"
      arg(:id, non_null(:string))
      resolve(&SpaceResolver.delete_entity/3)
    end
  end

  def context(ctx) do
    source = Dataloader.Ecto.new(Thexr.Repo)

    loader =
      Dataloader.new()
      |> Dataloader.add_source(Spaces, source)

    Map.put(ctx, :loader, loader)
  end

  def plugins do
    [Absinthe.Middleware.Dataloader] ++ Absinthe.Plugin.defaults()
  end
end
