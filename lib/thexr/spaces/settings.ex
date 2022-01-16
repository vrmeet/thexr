defmodule Thexr.Spaces.Settings do
  use Ecto.Schema
  import Ecto.Changeset

  @derive Jason.Encoder

  @primary_key false
  embedded_schema do
    field :clear_color, :string, default: "#00FF00"
  end

  def changeset(entity, params) do
    entity
    |> cast(params, [:clear_color])
    |> validate_required([:clear_color])
    |> validate_format(:clear_color, ~r/^\#[0-9A-Fa-f]{6}$/,
      message: "Invalid color string, example: #FF0000 for red"
    )
  end
end
