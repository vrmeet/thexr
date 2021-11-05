defmodule Thexr.Spaces.Component do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "components" do
    field :data, :map
    field :type, :string
    field :entity_id, :binary_id

    timestamps()
  end

  @doc false
  def changeset(component, attrs) do
    component
    |> cast(attrs, [:type, :data])
    |> validate_required([:type, :data])
  end
end
