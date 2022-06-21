defmodule Thexr.IntegrationTests do
  alias Thexr.Spaces
  alias Thexr.Spaces.CommandHandler
  alias Thexr.SpaceSupervisor

  def enemy_spawner_scenario() do
    {:ok, space} = Spaces.create_space(%{name: "test_#{Thexr.Utils.random_id()}"})
    SpaceSupervisor.start_space(space)

    CommandHandler.member_enter(space.id, "bob")
    CommandHandler.create_entity(space.id, "grid")
    CommandHandler.create_enemy_spawner(space.id, "spawner1", [3, 0, 3])
  end
end
