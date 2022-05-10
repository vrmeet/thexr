defmodule Thexr.Spaces.EventStream do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "event_streams" do
    field :payload, :map
    field :sequence, :integer
    field :type, :string
    belongs_to :space, Thexr.Spaces.Space
    field :event_timestamp, :integer
    timestamps(updated_at: false)
  end

  @doc false
  def changeset(event, attrs) do
    event
    |> cast(attrs, [:space_id, :type, :sequence, :payload, :event_timestamp])
    |> validate_required([:space_id, :type, :sequence, :payload, :event_timestamp])
  end
end
