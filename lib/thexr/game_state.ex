defmodule Thexr.GameState do
  states = [
    :no_game_in_progress,
    :game_in_progress
  ]

  for state <- states do
    def unquote(state)(), do: unquote(state)
  end
end
