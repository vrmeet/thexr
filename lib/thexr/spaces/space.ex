defmodule Thexr.Spaces.Space do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "spaces" do
    field :description, :string
    field :name, :string
    field :slug, :string
    has_many :entities, Thexr.Spaces.Entity
    timestamps()
  end

  @doc false
  def changeset(space, attrs) do
    space
    |> cast(attrs, [:name, :description, :slug])
    |> validate_required([:name, :slug])
  end
end
