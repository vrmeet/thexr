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
    entity =
      cond do
        attrs[:entity_id] == nil && attrs["entity_id"] == nil -> entity_fixture()
        true -> %{id: attrs[:entity_id] || attrs["entity_id"]}
      end

    attrs = Enum.into(attrs, %{"x" => 1, "y" => 0, "z" => -2})

    {:ok, component} = Thexr.Spaces.create_component_for_entity(entity.id, "position", attrs)

    component
  end
end
