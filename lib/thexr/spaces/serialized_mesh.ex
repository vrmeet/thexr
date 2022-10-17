defmodule Thexr.Spaces.SerializedMesh do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  schema "serialized_meshes" do
    field(:state_id, :string, primary_key: true)
    field(:id, :string, primary_key: true)
    field(:data, :map)
    timestamps()
  end

  def changeset(state, attrs) do
    state
    |> cast(attrs, [:state_id, :id, :data])
    |> validate_required([:state_id, :id, :data])
  end
end
