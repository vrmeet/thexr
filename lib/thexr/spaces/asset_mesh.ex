defmodule Thexr.Spaces.AssetMesh do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  schema "asset_meshes" do
    field(:id, :string, primary_key: true)
    field(:name, :string)
    field(:data, :map)
    timestamps()
  end

  def changeset(state, attrs) do
    state
    |> cast(attrs, [:id, :name, :data])
    |> validate_required([:id, :name, :data])
    |> unique_constraint(:id, name: :asset_meshes_pkey)
  end
end
