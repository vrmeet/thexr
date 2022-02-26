defmodule Thexr.Utils do
  def random_id(length \\ 5) do
    Enum.reduce(0..length, [], fn _, acc ->
      [Enum.random('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') | acc]
    end)
    |> to_string()
  end

  def rand_int() do
    Enum.random(-2_147_483_648..2_147_483_647)
  end
end
