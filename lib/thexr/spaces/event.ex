defmodule Thexr.Spaces.Event do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "events" do
    field :payload, :map
    field :sequence, :integer
    field :type, :string
    field :space_id, :binary_id
    timestamps()
  end

  @doc false
  def changeset(event, attrs) do
    event
    |> cast(attrs, [:space_id, :type, :sequence, :payload])
    |> validate_required([:space_id, :type, :sequence, :payload])
  end
end
