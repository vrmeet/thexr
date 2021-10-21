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
      |> Thexr.Spaces.create_space()

    space
  end

  @doc """
  Generate a entity.
  """
  def entity_fixture(attrs \\ %{}) do
    {:ok, entity} =
      attrs
      |> Enum.into(%{
        name: "some name",
        type: "some type"
      })
      |> Thexr.Spaces.create_entity()

    entity
  end
end
