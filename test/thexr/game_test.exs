defmodule Thexr.GameTest do
  use Thexr.DataCase

  alias Thexr.{Game}

  describe "game" do
    setup do
      game = %Game{}

      game_spec =
        File.read!("./test/support/fixtures/squid_game.json")
        |> Jason.decode!()

      %{game: Game.parse_spec(game, game_spec)}
    end

    test "get cmd to spawn to random location when person joins", %{game: game} do
      {game, cmd} = Game.process_event(game, "person_entered", %{"id" => "abc"})
      IO.inspect(game)
      IO.inspect(cmd)
    end
  end
end
