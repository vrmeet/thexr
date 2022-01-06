defmodule Thexr.Spaces.Component do
  use Ecto.Schema
  import Ecto.Changeset
  import PolymorphicEmbed, only: [cast_polymorphic_embed: 3]

  @derive {Jason.Encoder, only: [:type, :data]}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "components" do
    field :type, :string
    belongs_to :entity, Thexr.Spaces.Entity

    # field :data, :map
    field :data, PolymorphicEmbed,
      types: [
        position: Thexr.Components.Vector3,
        rotation: Thexr.Components.Vector3,
        scale: Thexr.Components.Vector3
      ],
      on_type_not_found: :raise,
      on_replace: :update

    timestamps()
  end

  @doc false
  def changeset(component, attrs) do
    # attrs = AtomicMap.convert(attrs)

    # type = attrs.type
    # data = Map.put(attrs.data, :__type__, type)
    # attrs = Map.put(attrs, :data, data)

    component
    |> remove_errors()
    |> cast(attrs, [:type, :entity_id])
    |> cast_polymorphic_embed(:data, required: true)

    # |> validate_required([:type, :d])
  end

  def remove_errors(%Ecto.Changeset{} = changeset) do
    %{changeset | errors: [], valid?: true}
  end

  def remove_errors(component) do
    component
  end
end
