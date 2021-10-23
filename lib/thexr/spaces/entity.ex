defmodule Thexr.Spaces.Entity do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "entities" do
    field :name, :string
    field :type, :string
    field :space_id, :binary_id
    field :parent_id, :binary_id

    timestamps()
  end

  def kinds do
    ["box", "cone", "sphere"]
  end

  @doc false
  def changeset(entity, attrs) do
    entity
    |> cast(attrs, [:name, :type, :space_id, :parent_id])
    |> validate_required([:type])
    |> create_name_if_missing()
  end

  def setparent_changeset(entity, parent_id) do
    entity |> cast(%{"parent_id" => parent_id}, [:parent_id])
  end

  def unsetparent_changeset(entity) do
    entity |> change() |> force_change(:parent_id, nil)
  end

  defp create_name_if_missing(changeset) do
    if changeset.valid? do
      case fetch_field(changeset, :name) do
        {:data, nil} ->
          kind = fetch_field!(changeset, :type)
          new_name = "#{kind}_#{Thexr.Utils.randId()}"
          put_change(changeset, :name, new_name)

        _ ->
          changeset
      end
      |> IO.inspect(label: "changeset")
    else
      changeset
    end
  end
end
