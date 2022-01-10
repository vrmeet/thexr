defmodule Thexr.Components.ColorString do
  use Ecto.Schema
  import Ecto.Changeset
  @derive Jason.Encoder

  @primary_key false

  embedded_schema do
    field :value, :string
  end

  def changeset(str, params) do
    str
    |> cast(params, [:value])
    |> validate_required([:value])
    |> validate_format(:value, ~r/^\#[0-9A-Fa-f]{6}$/,
      message: "Invalid color string, example: #FF0000 for red"
    )
  end
end
