defmodule Thexr.Spaces.Space do
  use Ecto.Schema
  import Ecto.Changeset
  @derive {Jason.Encoder, only: [:id, :name, :state_id]}

  @primary_key {:id, :string, []}
  schema "spaces" do
    field(:name, :string)
    field(:description, :string)
    field(:state_id, :string)
    # embeds_one(:settings, Settings, on_replace: :update)
    has_many(:entities, Thexr.Spaces.Entity, references: :state_id, foreign_key: :state_id)
    timestamps()
  end

  def changeset(space, attrs) do
    space
    |> cast(attrs, [:id, :name, :description, :state_id])
    |> validate_required([:id, :name, :state_id])
    |> unique_constraint(:id, name: :spaces_pkey)

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
