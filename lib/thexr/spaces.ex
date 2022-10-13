defmodule Thexr.Spaces do
  @moduledoc """
  The Spaces context.
  """

  import Ecto.Query, warn: false
  alias Ecto.Multi

  alias Thexr.Repo

  alias Thexr.Spaces.Space

  @doc """
  Returns the list of spaces.

  ## Examples

      iex> list_spaces()
      [%Space{}, ...]

  """
  def list_spaces do
    query = from Space, order_by: [desc: :inserted_at]
    Repo.all(query)
  end

  def get_space(id), do: Repo.get(Space, id)

  def new_space() do
    %Space{id: Thexr.Utils.random_id(5), state_id: Thexr.Utils.random_id(5)}
  end

  def create_space(attrs \\ %{}) do
    IO.inspect("in create space")

    %Space{}
    |> Space.changeset(attrs)
    |> Repo.insert()
    |> IO.inspect()
  end

  def delete_space(%Space{} = space) do
    Repo.delete(space)
  end

  def change_space(%Space{} = space, attrs \\ %{}) do
    Space.changeset(space, attrs)
  end

  def update_space(%Space{} = space, attrs) do
    space
    |> Space.changeset(attrs)
    |> Repo.update()

    # |> broadcast_space_update()
  end
end
