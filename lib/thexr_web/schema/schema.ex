defmodule ThexrWeb.Schema.Schema do
  use Absinthe.Schema
  import Absinthe.Resolution.Helpers, only: [dataloader: 1]

  import_types(Thexr.Schema.Types.Custom.JSON)

  alias ThexrWeb.Resolvers.SpaceResolver
  alias Thexr.Spaces

  object :space do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :description, :string
    # field :settings, :json
    field :entities, non_null(list_of(:entity)), resolve: dataloader(Spaces)
  end

  input_object :transform do
    field :position, list_of(:float)
    field :rotation, list_of(:float)
    field :scaling, list_of(:float)
  end

  input_object :grabbable do
    # "any" | "fixed"
    field :pickup, :string
    # lever?: any;
    # grabbed_by?: string;
    field :throwable, :boolean
    # "continuous" | "discreet";
    field :shootable, :string
  end

  input_object :components_object do
    field :transform, :transform
    field :grabbable, :grabbable
  end

  # TODO, get all events from S3
  # object :event_stream do
  #   field :sequence, non_null(:integer)
  #   field :event, :json
  # end

  object :entity do
    field :id, non_null(:id)
    # field :name, non_null(:string)
    # field :type, non_null(:string)
    # field :space_id, non_null(:id)
    # field :parent_id, :id
    field :components, :json
  end

  # object :component do
  #   field :type, non_null(:string)
  #   field :data, :json
  # end

  # input_object :space_input do
  #   field :name, :string
  #   field :description, :string
  #   field :settings, :settings_input
  # end

  # input_object :pos_rot_input do
  #   field :pos, list_of(:float)
  #   field :rot, list_of(:float)
  # end

  # input_object :settings_input do
  #   field :use_skybox, :boolean
  #   field :skybox_inclination, :float
  #   field :clear_color, :string
  #   field :fog_color, :string
  #   field :fog_density, :float
  # end

  query do
    @desc "Get all spaces"
    field :spaces, non_null(list_of(non_null(:space))) do
      resolve(&SpaceResolver.spaces/3)
    end

    # Add this field:
    @desc "Get a space using the id"
    field :space, :space do
      arg(:space_id, non_null(:string))
      resolve(&SpaceResolver.space/3)
    end

    # @desc "View events of a space"
    # field :events, non_null(list_of(:event_stream)) do
    #   arg(:space_id, non_null(:string))
    #   arg(:last_evaluated_sequence, :integer)
    #   resolve(&SpaceResolver.event_stream/3)
    # end

    # field :components, list_of(:component) do
    #   arg(:entity_id, non_null(:id))
    #   resolve(&SpaceResolver.components/3)
    # end
  end

  mutation do
    @desc "upsert entity for a space"
    field :upsert_entity, :boolean do
      arg(:space_id, non_null(:string))
      arg(:entity_id, non_null(:string))
      arg(:components, :components_object)
      resolve(&SpaceResolver.upsert_entity/3)
    end

    @desc "create entity for a space"
    field :create_entity, :boolean do
      arg(:space_id, non_null(:string))
      arg(:entity_id, non_null(:string))
      arg(:components, :components_object)
      resolve(&SpaceResolver.create_entity/3)
    end

    #   @desc "create box"
    #   field :create_box, :id do
    #     arg(:space_id, non_null(:string))
    #     arg(:depth, :float)
    #     arg(:width, :float)
    #     arg(:height, :float)
    #     arg(:size, :float)
    #     arg(:position, list_of(:float))
    #     arg(:scaling, list_of(:float))
    #     arg(:rotation, list_of(:float))
    #     resolve(&SpaceResolver.create_box/3)
    #   end

    #   @desc "create a wall"
    #   field :create_wall, :id do
    #     arg(:space_id, non_null(:string))
    #     arg(:height, :float)
    #     arg(:points, non_null(list_of(:float)))
    #     resolve(&SpaceResolver.create_wall/3)
    #   end

    #   @desc "create enemy spawner"
    #   field :create_enemy_spawner, :id do
    #     arg(:space_id, non_null(:string))
    #     arg(:position, list_of(:float))
    #     resolve(&SpaceResolver.create_enemy_spawner/3)
    #   end

    #   @desc "delete an entity from a space"
    #   field :delete_entity, :boolean do
    #     @desc "the id of the space"
    #     arg(:space_id, non_null(:string))
    #     @desc "the id of the entity"
    #     arg(:entity_id, non_null(:string))
    #     resolve(&SpaceResolver.delete_entity/3)
    #   end

    #   @desc "move an entity in a space"
    #   field :translate_entity, :boolean do
    #     @desc "the id of the space"
    #     arg(:space_id, non_null(:string))
    #     @desc "the id of the entity"
    #     arg(:entity_id, non_null(:string))
    #     @desc "vector3 array of position destination"
    #     arg(:position, non_null(list_of(:float)))
    #     resolve(&SpaceResolver.translate_entity/3)
    #   end

    #   @desc "rotate an entity in a space"
    #   field :rotate_entity, :boolean do
    #     @desc "the id of the space"
    #     arg(:space_id, non_null(:string))
    #     @desc "the id of the entity"
    #     arg(:entity_id, non_null(:string))
    #     @desc "vector3 array euler rotation"
    #     arg(:rotation, non_null(list_of(:float)))
    #     resolve(&SpaceResolver.rotate_entity/3)
    #   end

    #   @desc "scale an entity in a space"
    #   field :scale_entity, :boolean do
    #     @desc "the id of the space"
    #     arg(:space_id, non_null(:string))
    #     @desc "the id of the entity"
    #     arg(:entity_id, non_null(:string))
    #     @desc "vector3 array of scaling"
    #     arg(:scaling, non_null(list_of(:float)))
    #     resolve(&SpaceResolver.scale_entity/3)
    #   end

    #   @desc "color an entity in a space"
    #   field :color_entity, :boolean do
    #     @desc "the id of the space"
    #     arg(:space_id, non_null(:string))
    #     @desc "the id of the entity"
    #     arg(:entity_id, non_null(:string))
    #     @desc "color string #FF0000"
    #     arg(:color, non_null(:string))
    #     resolve(&SpaceResolver.color_entity/3)
    #   end

    #   @desc "playback stream"
    #   field :playback, :boolean do
    #     @desc "the id of the space"
    #     arg(:space_id, non_null(:string))
    #     arg(:start_seq, non_null(:integer))
    #     arg(:end_seq, non_null(:integer))
    #     resolve(&SpaceResolver.playback/3)
    #   end
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
