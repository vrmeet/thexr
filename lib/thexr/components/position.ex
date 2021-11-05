defmodule Thexr.Components.Position do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false

  embedded_schema do
    field :x, :float
    field :y, :float
    field :z, :float
  end

  def changeset(position, params) do
    position
    |> cast(params, ~w(x y z)a)

    # |> validate_required(:address)
    # |> validate_length(:address, min: 4)
  end
end
