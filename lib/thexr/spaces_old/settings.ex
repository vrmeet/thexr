defmodule Thexr.SpacesOld.Settings do
  use Ecto.Schema
  import Ecto.Changeset

  @derive Jason.Encoder

  @attributes ~w(clear_color fog_color fog_density use_skybox skybox_inclination)a

  @primary_key false
  embedded_schema do
    field :use_skybox, :boolean, default: false
    field :skybox_inclination, :float, default: 0.0
    field :clear_color, :string, default: "#201111"
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
