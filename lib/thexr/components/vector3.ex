defmodule Thexr.Components.Vector3 do
  use Ecto.Schema
  import Ecto.Changeset
  @derive Jason.Encoder

  @primary_key false

  embedded_schema do
    field :x, :float
    field :y, :float
    field :z, :float
  end

  def changeset(vec3, params) do
    vec3
    |> cast(params, ~w(x y z)a)
    |> validate_required(~w(x y z)a)

    # |> validate_length(:address, min: 4)
  end
end
