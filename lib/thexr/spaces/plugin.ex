defmodule Thexr.Spaces.Plugin do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "plugins" do
    field :js, :string
    field :ts, :string

    timestamps()
  end

  @doc false
  def changeset(plugin, attrs) do
    plugin
    |> cast(attrs, [:ts, :js])
    |> validate_required([:ts, :js])
  end
end
