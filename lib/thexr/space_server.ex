defmodule Thexr.SpaceServer do
  @moduledoc """
  A space server process that holds some data common for a space.
  """
  # alias BabylonPhoenix.Util
  use GenServer, restart: :transient
  require Logger

  @timeout :timer.minutes(5)
  @kick_check_timeout :timer.seconds(5)

  # Client (Public) Interface

  @doc """
  Spawns a new space server process registered under the given `space.id`.
  options are passed to initialize the space state
  """
  def start_link(space_id) do
    GenServer.start_link(
      __MODULE__,
      {:ok, space_id},
      name: via_tuple(space_id)
    )
  end
  @doc """
  Returns a tuple used to register and lookup a game server process by name.
  """
  def via_tuple(space_id) do
    {:via, Registry, {Thexr.SpaceRegistry, space_id}}
  end

  @doc """
  Returns the `pid` of the game server process registered under the
  given `game_name`, or `nil` if no process is registered.
  """
  def pid(space_id) do
    space_id
    |> via_tuple()
    |> GenServer.whereis()
  end

  def patch_state(space_id, entity_id, components) do
    GenServer.cast(via_tuple(space_id), {:patch_state, entity_id, components})
  end

  #################################################################
  # Server Callbacks
  #################################################################

  def init({:ok, space_id}) do

    {:ok,
     %{
       space_id: space_id,
       state: %{}
     }, @timeout}
  end

  def handle_cast({:patch_state, entity_id, components}, state) do
    entity_current_components = Map.get(state.state, entity_id)
    new_entity_components = case {entity_current_components, components} do
      {%{}, %{}} -> Map.merge(entity_current_components, components)
      _ -> components
    end
    new_state = Map.put(state.state, entity_id, new_entity_components)
    state = Map.put(state, :state, new_state)
    {:noreply, state, @timeout}
  end

  def terminate({:shutdown, :timeout}, _game) do
    IO.inspect("space terminating from shutdown timeout")
    :ok
  end

  def terminate(_reason, _game) do
    IO.inspect("space terminating some other reason")
    :ok
  end

end
