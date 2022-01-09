defmodule Thexr.Components.String do
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
  end
end
