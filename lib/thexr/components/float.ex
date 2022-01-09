defmodule Thexr.Components.Float do
  use Ecto.Schema
  import Ecto.Changeset
  @derive Jason.Encoder

  @primary_key false

  embedded_schema do
    field :value, :float
  end

  def changeset(str, params) do
    str
    |> cast(params, [:value])
    |> validate_required([:value])
  end
end
