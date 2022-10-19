defmodule Thexr.SpacesOld.EventStream do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "event_streams" do
    field :event, :map
    field :sequence, :integer
    belongs_to :space, Thexr.Spaces.Space
    timestamps(updated_at: false)
  end

  @doc false
  def changeset(event, attrs) do
    event
    |> cast(attrs, [:space_id, :sequence, :event])
    |> validate_required([:space_id, :sequence, :event])
  end
end
