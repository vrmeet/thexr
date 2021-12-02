defmodule Thexr.ExperienceConfig do
  alias Thexr.ExperienceConfig

  defstruct min_players: 0,
            game_start_debounce_sec: 5,
            initial_spawn_plane: nil,
            game_start_spawn_plane: nil

  def parse_construct(config, %{
        "type" => "spawn_plane",
        "name" => "initial",
        "params" => params
      }) do
    %ExperienceConfig{
      config
      | initial_spawn_plane: AtomicMap.convert(params)
    }
  end

  def parse_construct(config, %{
        "type" => "spawn_plane",
        "name" => "game_start",
        "params" => params
      }) do
    %ExperienceConfig{
      config
      | game_start_spawn_plane: AtomicMap.convert(params)
    }
  end

  def parse_construct(config, %{
        "type" => "opt_in_sign",
        "params" => %{"min_players" => min_players, "debounce_sec" => debounce_sec}
      }) do
    %ExperienceConfig{config | min_players: min_players, game_start_debounce_sec: debounce_sec}
  end

  def parse_construct(config, construct) do
    IO.inspect(construct, label: "unhandled parse_construct")
    config
  end
end
