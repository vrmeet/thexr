defmodule Thexr.SpacesOld.Treepath do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  schema "treepaths" do
    field :ancestor_id, Ecto.UUID, primary_key: true
    field :descendant_id, Ecto.UUID, primary_key: true
    field :depth, :integer, default: 0
  end

  @doc false
  def changeset(treepath, attrs) do
    treepath
    |> cast(attrs, [])
    |> validate_required([])
  end
end
