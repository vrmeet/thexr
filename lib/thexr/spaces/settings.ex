defmodule Thexr.Spaces.Settings do
  use Ecto.Schema
  import Ecto.Changeset

  @derive Jason.Encoder

  @attributes ~w(clear_color fog_color fog_density)a

  @primary_key false
  embedded_schema do
    field :clear_color, :string, default: "#00FF00"
    field :fog_color, :string, default: "#FEFAF0"
    field :fog_density, :float, default: 0.01
  end

  def changeset(entity, params) do
    entity
    |> cast(params, @attributes)
    |> validate_required(@attributes)
    |> validate_format(:clear_color, ~r/^\#[0-9A-Fa-f]{6}$/,
      message: "Invalid color string, example: #FF0000 for red"
    )
    |> validate_format(:fog_color, ~r/^\#[0-9A-Fa-f]{6}$/,
      message: "Invalid color string, example: #FF0000 for red"
    )
  end
end
