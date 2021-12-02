defmodule Thexr.Game do
  alias Thexr.{Game, ExperienceConfig, Participant, GameState}

  defstruct participants: %{},
            config: %ExperienceConfig{},
            game_state: GameState.no_game_in_progress()

  def load_config(game = %Game{}, config = %ExperienceConfig{}) do
    %Game{game | config: config}
  end

  def parse_spec(game = %Game{}, %{"constructs" => constructs}) do
    config =
      Enum.reduce(constructs, %ExperienceConfig{}, fn construct, config ->
        ExperienceConfig.parse_construct(config, construct)
      end)

    %Game{game | config: config}
  end

  def start_game(game = %Game{}) do
    game =
      modify_participants(game, fn p -> Participant.opted_in?(p) end, fn p ->
        Participant.start_playing(p)
      end)

    %Game{game | game_state: GameState.game_in_progress()}
  end

  def process_event(game = %Game{}, "person_entered", %{"id" => id}) do
    new_participants = Map.put(game.participants, id, Participant.new(id))
    game = %Game{game | participants: new_participants}

    {game,
     {:person_teleported,
      %{id: id, position: get_random_spawn_point(game.config.initial_spawn_plane)}}}
  end

  def process_event(game = %Game{}, "person_opt_in", %{"id" => id}) do
    game =
      modify_participant(game, id, fn participant ->
        Participant.opt_in(participant)
      end)

    # now return a tuple saying condition met?
    if game.config.min_players <= num_ready_to_play(game.participants) do
      {game, {:min_player_met, game.config.game_start_debounce_sec}}
    else
      {game, nil}
    end
  end

  def process_event(game = %Game{}, "person_left", %{"id" => id}) do
    new_participants = Map.delete(game.participants, id)
    {%Game{game | participants: new_participants}, nil}
  end

  def damaged(game, id, damage) do
    modify_participant(game, id, fn participant ->
      %Participant{participant | health: participant.health - damage}
    end)
  end

  def modify_participant(game, id, func) do
    participant = Map.get(game.participants, id)
    participant = func.(participant)
    new_participants = Map.put(game.participants, id, participant)
    %Game{game | participants: new_participants}
  end

  def modify_participants(game, predicate_fn, transformation_fn) do
    new_participants =
      Enum.reduce(game.participants, %{}, fn {id, participant}, acc ->
        new_participant =
          if predicate_fn.(participant) do
            transformation_fn.(participant)
          else
            participant
          end

        Map.put(acc, id, new_participant)
      end)

    %Game{game | participants: new_participants}
  end

  def num_ready_to_play(participants) do
    Enum.count(participants, fn {_k, v} ->
      Participant.opted_in?(v)
    end)
  end

  def get_random_spawn_point(%{position: %{x: x, y: y, z: z}, length: length, width: width}) do
    rand_x = :rand.uniform() * width + x - width / 2
    rand_z = :rand.uniform() * length + z - length / 2
    %{x: rand_x, y: y, z: rand_z}
  end

  def get_random_spawn_point(_) do
    get_random_spawn_point(%{position: %{x: 0, y: 0, z: 0}, length: 1.5, width: 1.5})
  end
end
