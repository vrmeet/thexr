defmodule Thexr.Spaces.Entity do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  schema "entities" do
    field(:state_id, :string, primary_key: true)
    field(:id, :string, primary_key: true)
    field(:components, :map)
    timestamps()
  end

  def changeset(state, attrs) do
    state
    |> cast(attrs, [:state_id, :id, :components])
    |> validate_required([:state_id, :id, :components])

    # |> cast_embed(:settings)
  end

  # def create_id_if_not_set(changeset) do
  #   if changeset.valid? do
  #     case fetch_field(changeset, :id) do
  #       {:data, nil} ->
  #         put_change(changeset, :id, Thexr.Utils.random_id(5))

  #       _ ->
  #         changeset
  #     end
  #   else
  #     changeset
  #   end
  # end

  # def create_settings_if_missing(changeset) do
  #   if changeset.valid? do
  #     case fetch_field(changeset, :settings) do
  #       {:data, nil} ->
  #         settings = %Thexr.Spaces.Settings{}
  #         put_change(changeset, :settings, settings)

  #       _ ->
  #         changeset
  #     end
  #   else
  #     changeset
  #   end
  # end
end
