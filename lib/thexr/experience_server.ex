defmodule Thexr.ExperienceServer do
  @moduledoc """
  A game server process that holds a `Game` struct as its state.
  """
  # alias BabylonPhoenix.Util
  use GenServer, restart: :transient
  require Logger

  alias Thexr.{Game, ExperienceConfig}

  @timeout :timer.minutes(25)
  @kick_check_time :timer.seconds(5)
  @flush_member_movements 100

  # Client (Public) Interface

  @doc """
  Spawns a new space server process registered under the given `space_slug`.
  options are passed to initialize the space state
  """
  def start_link(slug) do
    GenServer.start_link(
      __MODULE__,
      {:ok, slug},
      name: via_tuple(slug)
    )
  end

  def process_event(slug, event_name, payload) do
    GenServer.cast(via_tuple(slug), {:process_event, event_name, payload})
  end

  def dump_state(slug) do
    GenServer.call(via_tuple(slug), :dump_state)
  end

  def parse_game_spec(slug, spec) do
    GenServer.cast(via_tuple(slug), {:parse_spec, spec})
  end

  def load_experience_config(slug, config = %ExperienceConfig{}) do
    GenServer.cast(via_tuple(slug), {:load_config, config})
  end

  @spec via_tuple(any) :: {:via, Registry, {Thexr.ExperienceRegistry, any}}
  @doc """
  Returns a tuple used to register and lookup a game server process by name.
  """
  def via_tuple(slug) do
    {:via, Registry, {Thexr.ExperienceRegistry, slug}}
  end

  @doc """
  Returns the `pid` of the game server process registered under the
  given `game_name`, or `nil` if no process is registered.
  """
  def pid(slug) do
    slug
    |> via_tuple()
    |> GenServer.whereis()
  end

  #################################################################
  # Server Callbacks
  #################################################################

  def init({:ok, slug}) do
    {:ok,
     %{
       slug: slug,
       game: %Game{},
       game_start_debounce_ref: nil
     }, @timeout}
  end

  def handle_call(:dump_state, _from, state) do
    {:reply, state, state}
  end

  def handle_cast({:load_config, config}, state) do
    new_game = Game.load_config(state.game, config)
    state = Map.put(state, :game, new_game)
    {:noreply, state, @timeout}
  end

  def handle_cast({:process_event, event_name, payload}, state) do
    {new_game, cmd} = Game.process_event(state.game, event_name, payload)

    state = Map.put(state, :game, new_game)
    state = process_cmd(state, cmd)
    {:noreply, state, @timeout}
  end

  def handle_cast({:parse_spec, spec}, state) do
    new_game = Game.parse_spec(state.game, spec)
    state = Map.put(state, :game, new_game)
    {:noreply, state, @timeout}
  end

  def handle_info(:start_game, state) do
    new_game = Game.start_game(state.game)
    state = Map.put(state, :game, new_game)
    {:noreply, state, @timeout}
  end

  def terminate({:shutdown, :timeout}, _game) do
    :ok
  end

  def terminate(_reason, _game) do
    :ok
  end

  defp process_cmd(state, nil) do
    state
  end

  defp process_cmd(state, {:min_player_met, debounce_time_sec}) do
    case state.game_start_debounce_ref do
      nil ->
        Map.put(
          state,
          :game_start_debounce_ref,
          Process.send_after(self(), :start_game, debounce_time_sec * 1000)
        )

      ref ->
        Process.cancel_timer(ref)
        Map.put(state, :game_start_debounce_ref, nil)
    end
  end

  defp process_cmd(state, {:person_teleported, payload}) do
    ThexrWeb.Endpoint.broadcast!(state.slug, "person_teleported", payload)
    state
  end

  defp process_cmd(state, cmd) do
    IO.inspect(cmd, label: "unhandled process cmd")
    state
  end
end
