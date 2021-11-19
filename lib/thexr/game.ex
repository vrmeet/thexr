defmodule Thexr.Game do
  alias Thexr.{Game, ExperienceConfig, Participant, GameState}

  defstruct participants: %{},
            config: %ExperienceConfig{},
            game_state: GameState.no_game_in_progress()

  def load_config(game = %Game{}, config = %ExperienceConfig{}) do
    %Game{game | config: config}
  end

  def parse_spec(game = %Game{}, %{"constructs" => constructs}) do
    opt_in_sign =
      Enum.find(constructs, nil, fn construct ->
        construct["type"] == "opt_in_sign"
      end)

    case opt_in_sign do
      nil ->
        game

      sign ->
        min_players = sign["params"]["min_players"]
        %Game{game | config: %ExperienceConfig{min_players: min_players}}
    end
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
    {game, nil}
  end

  def process_event(game = %Game{}, "person_opt_in", %{"id" => id}) do
    game =
      modify_participant(game, id, fn participant ->
        Participant.opt_in(participant)
      end)

    # now return a tuple saying condition met?
    if game.config.min_players <= num_ready_to_play(game.participants) do
      {game, :min_players_met}
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
end
