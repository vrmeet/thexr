defmodule Thexr.SpacesOld.SpaceOld do
  use Ecto.Schema
  import Ecto.Changeset

  alias Thexr.Spaces.Settings

  @primary_key {:id, :string, []}
  schema "spaces" do
    field(:description, :string)
    # embeds_one(:settings, Settings, on_replace: :update)
    timestamps()
  end

  @doc false
  def new_changeset(space, attrs) do
    space
    |> cast(attrs, [:name, :description])
    |> validate_required([:name])

    # |> cast_embed(:settings)
  end

  def edit_changeset(space, attrs) do
    space
    |> cast(attrs, [:name, :description])
    |> validate_required([:name])

    # |> cast_embed(:settings)
  end

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
