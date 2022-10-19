defmodule Thexr.Spaces.AssetMesh do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  schema "asset_meshes" do
    field(:id, :string, primary_key: true)
    field(:data, :map)
    timestamps()
  end

  def changeset(state, attrs) do
    state
    |> cast(attrs, [:id, :data])
    |> validate_required([:id, :data])
  end
end
