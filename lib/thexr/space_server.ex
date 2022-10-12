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

  def space_state(server) when is_pid(server) do
    GenServer.call(server, :space_state)
  end

  def space_state(space_id) do
    GenServer.call(via_tuple(space_id), :space_state)
  end

  def process_event(server, event, message, channel_pid) when is_pid(server) do
    message = AtomicMap.convert(message, %{safe: false})
    GenServer.cast(server, {:process_event, event, message, channel_pid})
  end

  def process_event(space_id, event, message, channel_pid) do
    message = AtomicMap.convert(message, %{safe: false})
    GenServer.cast(via_tuple(space_id), {:process_event, event, message, channel_pid})
  end

  def member_connected(server, member_id) do
    GenServer.cast(server, {:member_connected, member_id})
  end

  def member_disconnected(server, member_id) do
    GenServer.cast(server, {:member_disconnected, member_id})
  end

  #################################################################
  # Server Callbacks
  #################################################################

  def init({:ok, space_id}) do
    {:ok,
     %{
       disconnected: MapSet.new(),
       space_id: space_id,
       space_state: %{},
       commands: []
     }, @timeout}
  end

  def handle_call(:space_state, _from, state) do
    {:reply, state.space_state, state}
  end

  def handle_cast({:process_event, event, message, channel_pid}, state) do
    # for now, broadcast everything to every body
    if channel_pid == nil do
      ThexrWeb.Endpoint.broadcast("space:#{state.space_id}", event, message)
    else
      ThexrWeb.Endpoint.broadcast_from(channel_pid, "space:#{state.space_id}", event, message)
    end

    # patch the state
    new_space_state = make_patch(event, message, state.space_state)
    state = Map.put(state, :space_state, new_space_state)
    # add commands

    {:noreply, state, @timeout}
  end

  def handle_cast({:member_connected, member_id}, state) do
    new_disconnected = MapSet.delete(state.disconnected, member_id)
    state = %{state | disconnected: new_disconnected}
    {:noreply, state, @timeout}
  end

  def handle_cast({:member_disconnected, member_id}, state) do
    new_disconnected = MapSet.put(state.disconnected, member_id)
    state = %{state | disconnected: new_disconnected}
    Process.send_after(self(), :kick_check, @kick_check_timeout)
    {:noreply, state, @timeout}
  end

  def handle_info(:kick_check, state) do
    if MapSet.size(state.disconnected) > 0 do
      __MODULE__.process_event(
        self(),
        "entities_deleted",
        %{
          ids: MapSet.to_list(state.disconnected)
        },
        nil
      )
    end

    state = %{state | disconnected: MapSet.new()}
    {:noreply, state, @timeout}
  end

  def handle_info(:timeout, state) do
    IO.inspect("space server timed out after no activity")
    {:stop, :normal, state}
  end

  def make_patch(
        "components_upserted",
        %{id: entity_id, components: components},
        space_state
      ) do
    patch_space_state(entity_id, components, space_state)
  end

  def make_patch("entity_created", %{id: entity_id, components: components}, space_state) do
    patch_space_state(entity_id, components, space_state)
  end

  def make_patch("entities_deleted", %{ids: entity_ids}, space_state) do
    # patch_space_state(entity_id, :tombstone, space_state)
    Enum.reduce(entity_ids, space_state, fn id, acc ->
      Map.delete(acc, id)
    end)
  end

  def make_patch("components_removed", %{id: entity_id, names: names}, space_state) do
    entity_current_components = Map.get(space_state, entity_id)

    new_entity_components =
      Enum.reduce(names, entity_current_components, fn name, acc ->
        Map.delete(acc, name)
      end)

    Map.put(space_state, entity_id, new_entity_components)
  end

  def patch_space_state(entity_id, components, space_state) do
    entity_current_components = Map.get(space_state, entity_id)

    new_entity_components =
      case {entity_current_components, components} do
        {%{}, %{}} ->
          # Map.merge/3 adds keys in 2nd map to keys in 1st map, resolving any key conflicts with a function
          Map.merge(entity_current_components, components, fn _key, old_val, new_val ->
            case {old_val, new_val} do
              {%{}, %{}} -> Map.merge(old_val, new_val)
              _ -> new_val
            end
          end)

        _ ->
          components
      end

    Map.put(space_state, entity_id, new_entity_components)
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
