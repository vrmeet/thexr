defmodule Thexr.GameTest do
  use Thexr.DataCase

  alias Thexr.{Game}

  describe "game" do
    test "parse a spec" do
      game = %Game{}

      game_spec =
        File.read!("./test/support/fixtures/squid_game.json")
        |> Jason.decode!()

      new_game = Game.parse_spec(game, game_spec)
    end
  end
end
