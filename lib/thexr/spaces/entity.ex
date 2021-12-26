defmodule Thexr.Spaces.Entity do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "entities" do
    field :name, :string
    field :type, :string
    field :space_id, Ecto.UUID
    field :parent_id, :binary_id
    has_many :components, Thexr.Spaces.Component
    # field :child_count, :integer, default: 0
    # has_many :children, Thexr.Spaces.Entity, foreign_key: :parent_id
    timestamps()
  end

  def kinds do
    ["box", "cone", "sphere"]
  end

  def default_components(_) do
    %{
      "position" => %{"x" => 0, "y" => 0, "z" => 0},
      "rotation" => %{"x" => 0, "y" => 0, "z" => 0},
      "scale" => %{"x" => 1, "y" => 1, "z" => 1}
    }
  end

  def build_default_components(%{"type" => type} = attrs) do
    default_components = default_components(type)

    components =
      Enum.map(default_components, fn {k, v} ->
        %{"type" => k, "data" => Map.put(v, "__type__", k)}
      end)

    Map.put(attrs, "components", components)
  end

  def build_default_components(attrs) do
    IO.inspect(attrs)
    raise "build_default_components requires a map with a type key"
  end

  def changeset(entity, attrs) do
    entity
    |> cast(attrs, [:name, :type, :space_id, :parent_id])
    |> validate_required([:type])
    |> cast_assoc(:components, with: &Thexr.Spaces.Component.changeset/2)
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
    else
      changeset
    end
  end
end
