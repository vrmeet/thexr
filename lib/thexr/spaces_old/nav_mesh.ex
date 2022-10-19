defmodule Thexr.SpacesOld.NavMesh do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "nav_meshes" do
    field :data, :binary
    belongs_to :space, Thexr.Spaces.Space
    timestamps()
  end

  @doc false
  def changeset(nav_mesh, attrs) do
    nav_mesh
    |> cast(attrs, [:space_id, :data])
    |> validate_required([:space_id, :data])
  end
end
