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
        name: "some name",
        slug: "some slug"
      })
      |> IO.inspect(label: "creating space fixture")
      |> Thexr.Spaces.create_space()

    space
  end

  @doc """
  Generate a entity.
  """
  def entity_fixture(attrs \\ %{}) do
    IO.inspect(attrs, label: "entity fixture receiving attrs")

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
      |> IO.inspect(label: "entity attrs")
      |> Thexr.Spaces.create_entity()

    entity
  end
end
