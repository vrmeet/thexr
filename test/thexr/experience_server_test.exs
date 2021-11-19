defmodule Thexr.ExperienceServerTest do
  use Thexr.DataCase

  alias Thexr.{ExperienceSupervisor, ExperienceServer, ExperienceConfig, Attendance}
  @slug "squid"
  setup do
    ExperienceSupervisor.start_experience(@slug)
    :ok
  end

  describe "starting a game" do
    test "it starts game after 3 people have opted in" do
      # load experience with a spec

      # 1. parse the squid.json -> ExperienceConfig

      game_spec =
        File.read!("./test/support/fixtures/squid_game.json")
        |> Jason.decode!()

      ExperienceServer.parse_game_spec(@slug, game_spec)

      ExperienceServer.process_event(@slug, "person_entered", %{"id" => "abc"})
      ExperienceServer.process_event(@slug, "person_entered", %{"id" => "xyz"})
      ExperienceServer.process_event(@slug, "person_entered", %{"id" => "def"})
      ExperienceServer.process_event(@slug, "person_opt_in", %{"id" => "def"})
      ExperienceServer.process_event(@slug, "person_opt_in", %{"id" => "abc"})
      :timer.sleep(2000)
      state = ExperienceServer.dump_state(@slug) |> IO.inspect()
    end
  end
end
