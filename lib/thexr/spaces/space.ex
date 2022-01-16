defmodule Thexr.Spaces.Space do
  use Ecto.Schema
  import Ecto.Changeset

  alias Thexr.Spaces.Settings

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "spaces" do
    field :description, :string
    field :name, :string
    field :slug, :string
    # field :data, :string, default: ""
    embeds_one :settings, Settings, on_replace: :update

    has_many :entities, Thexr.Spaces.Entity
    timestamps()
  end

  @doc false
  def new_changeset(space, attrs) do
    space
    |> cast(attrs, [:name, :description])
    |> validate_required([:name])
    |> cast_embed(:settings)
  end

  def edit_changeset(space, attrs) do
    space
    |> cast(attrs, [:name, :description, :slug])
    |> validate_required([:name, :description, :slug])
    |> cast_embed(:settings)
    |> create_rand_slug_if_missing()
    |> unique_constraint(:slug)
  end

  def create_settings_if_missing(changeset) do
    if changeset.valid? do
      case fetch_field(changeset, :settings) do
        {:data, nil} ->
          settings = %Thexr.Spaces.Settings{}
          put_change(changeset, :settings, settings)

        _ ->
          changeset
      end
    else
      changeset
    end
  end

  def create_rand_slug_if_missing(changeset) do
    if changeset.valid? do
      case fetch_field(changeset, :slug) do
        {:data, nil} ->
          name =
            fetch_field!(changeset, :name)
            |> String.replace(~r/[^a-zA-Z0-9]/, "-")

          new_slug = "#{name}_#{Thexr.Utils.randId()}"
          put_change(changeset, :slug, new_slug)

        _ ->
          changeset
      end
    else
      changeset
    end
  end
end
