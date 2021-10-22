defmodule Thexr.Spaces.Entity do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "entities" do
    field :name, :string
    field :type, :string
    field :space_id, :binary_id
    field :parent_id, :binary_id

    timestamps()
  end

  def kinds do
    ["box", "cone", "sphere"]
  end

  @doc false
  def changeset(entity, attrs) do
    entity
    |> cast(attrs, [:name, :type, :space_id, :parent_id])
    |> validate_required([:name, :type])
  end
end
