defmodule Thexr.Spaces.StateMesh do
  use Ecto.Schema

  @primary_key false
  schema "state_meshes" do
    field(:state_id, :string, primary_key: true)
    field(:id, :string, primary_key: true)
    field(:data, :map)
    timestamps()
  end
end
