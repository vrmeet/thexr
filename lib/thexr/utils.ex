defmodule Thexr.Utils do
  def randId(length \\ 5) do
    Enum.reduce(0..length, [], fn _, acc ->
      [Enum.random('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') | acc]
    end)
    |> to_string()
  end
end
