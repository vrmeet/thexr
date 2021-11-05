defmodule Thexr.Spaces.Component do
  use Ecto.Schema
  import Ecto.Changeset
  import PolymorphicEmbed, only: [cast_polymorphic_embed: 3]

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "components" do
    field :type, :string
    field :entity_id, :binary_id

    # field :data, :map
    field :data, PolymorphicEmbed,
      types: [
        position: Thexr.Components.Position
      ],
      on_type_not_found: :raise,
      on_replace: :update

    timestamps()
  end

  @doc false
  def changeset(component, attrs) do
    component
    |> cast(attrs, [:type])
    |> cast_polymorphic_embed(:data, required: true)

    # |> validate_required([:type, :d])
  end
end
