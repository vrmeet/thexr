defmodule Thexr.SpacesFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Thexr.Spaces` context.
  """

  @doc """
  Generate a space.
  """
  def space_fixture(attrs \\ %{}) do
    {:ok, space} =
      attrs
      |> Enum.into(%{
        description: "some description",
        name: "some name"
      })
      |> Thexr.Spaces.create_space()

    space
  end

  @doc """
  Generate a entity.
  """
  def entity_fixture(attrs \\ %{}) do
    space =
      cond do
        attrs[:space_id] == nil && attrs["space_id"] == nil -> space_fixture()
        true -> %{id: attrs[:space_id] || attrs["space_id"]}
      end

    {:ok, entity} =
      attrs
      |> Enum.into(%{
        name: "some name",
        type: "some type",
        space_id: space.id
      })
      |> Thexr.Spaces.create_entity()

    entity
  end

  @doc """
  Generate a component.
  """
  def component_fixture(attrs \\ %{}) do
    {:ok, component} =
      attrs
      |> Enum.into(%{
        data: %{},
        type: "some type"
      })
      |> Thexr.Spaces.create_component()

    component
  end

  @doc """
  Generate a plugin.
  """
  def plugin_fixture(attrs \\ %{}) do
    {:ok, plugin} =
      attrs
      |> Enum.into(%{
        js: "some js",
        ts: "some ts"
      })
      |> Thexr.Spaces.create_plugin()

    plugin
  end
end
