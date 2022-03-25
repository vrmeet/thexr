defmodule Thexr.Spaces.Entity do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :parent_id, :name, :type, :components]}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "entities" do
    field :name, :string
    field :type, :string
    field :space_id, Ecto.UUID
    field :parent_id, :binary_id
    has_many :components, Thexr.Spaces.Component
    timestamps()
  end

  # TODO, can we remove this?  once we've migrated space edit to svelte?
  def kinds do
    ["box", "cone", "sphere", "grid", "plane", "spawn_point"]
  end

  def default_components("spawn_point") do
    %{
      "position" => %{"x" => 0, "y" => 1.7, "z" => -8}
    }
  end

  def default_components("grid") do
    %{
      "position" => %{"x" => 0, "y" => -0.01, "z" => 0},
      "rotation" => %{"x" => 1.5708, "y" => 0, "z" => 0},
      "scale" => %{"x" => 1, "y" => 1, "z" => 1}
    }
  end

  def default_components(_) do
    %{
      "position" => %{"x" => 0, "y" => 0, "z" => 0},
      "rotation" => %{"x" => 0, "y" => 0, "z" => 0},
      "scale" => %{"x" => 1, "y" => 1, "z" => 1},
      "color" => "#FFFFFF"
    }
  end

  def build_default_components(%{"type" => type} = attrs) do
    if !Map.has_key?(attrs, "components") do
      set_components_in_attrs(attrs, default_components(type))
    else
      attrs
    end
  end

  def build_default_components(attrs) do
    raise "build_default_components requires a map with a type key"
  end

  def set_components_in_attrs(attrs, given_components) do
    components =
      Enum.map(given_components, fn {component_type, component_value} ->
        %{
          "type" => component_type,
          "data" => construct_component_data(component_type, component_value)
        }
      end)

    Map.put(attrs, "components", components)
  end

  def construct_component_data(component_type, component_value) when is_map(component_value) do
    Map.put(component_value, "__type__", component_type)
  end

  def construct_component_data(component_type, component_value) do
    %{"__type__" => component_type, "value" => component_value}
  end

  def changeset(entity, attrs) do
    entity
    |> cast(attrs, [:id, :name, :type, :space_id, :parent_id])
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
          new_name = "#{kind}_#{Thexr.Utils.random_id()}"
          put_change(changeset, :name, new_name)

        _ ->
          changeset
      end
    else
      changeset
    end
  end
end
