defmodule Thexr.SpaceServer do
  @moduledoc """
  A space server process that holds some data common for a space.
  """
  # alias BabylonPhoenix.Util
  use GenServer, restart: :transient
  require Logger

  @timeout :timer.minutes(25)
  @kick_check_timeout :timer.seconds(5)

  # Client (Public) Interface

  @doc """
  Spawns a new space server process registered under the given `space.id`.
  options are passed to initialize the space state
  """
  def start_link(space) do
    GenServer.start_link(
      __MODULE__,
      {:ok, space},
      name: via_tuple(space.id)
    )
  end

  def process_event(space_id, event, pid) when is_map(event) do
    {event_atom, atomized_event} = tuple = Thexr.Utils.tupleize_event_payload(event)
    process_event(space_id, event_atom, atomized_event, pid)
    tuple
  end

  def process_event(space_id, event_atom, atomized_event, pid)
      when is_atom(event_atom) and is_map(atomized_event) do
    GenServer.cast(via_tuple(space_id), {:event, event_atom, atomized_event, pid})
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

  def ets_refs(space_id) do
    if pid(space_id) == nil do
      {:error, :process_not_found}
    else
      GenServer.call(via_tuple(space_id), :get_ets_refs)
    end
  end

  def summary(space_id) do
    GenServer.call(via_tuple(space_id), :summary)
  end

  # used to support future disconnects by the server
  def member_connected(space_id, member_id) do
    GenServer.cast(via_tuple(space_id), {:member_connected, member_id})
  end

  def member_disconnected(space_id, member_id) do
    GenServer.cast(via_tuple(space_id), {:member_disconnected, member_id})
  end

  #################################################################
  # Server Callbacks
  #################################################################

  def init({:ok, space}) do
    member_movements =
      :ets.new(:member_movements, [
        :set,
        :public,
        {:write_concurrency, true},
        {:read_concurrency, true}
      ])

    member_states =
      :ets.new(:member_states, [
        :set,
        :public,
        {:write_concurrency, true},
        {:read_concurrency, true}
      ])

    {:ok,
     %{
       space: space,
       member_movements: member_movements,
       member_states: member_states,
       sequence: Thexr.Spaces.max_event_sequence(space.id),
       disconnected: MapSet.new()
     }, @timeout}
  end

  # :ets.insert(
  #   socket.assigns.ets_refs,
  #   {socket.assigns.member_id, p0, p1, p2, r0, r1, r2, r3, left, right}
  # )

  def handle_cast({:event, msg, evt, pid}, state) do
    state = %{state | sequence: state.sequence + 1}

    event_stream_attrs = %{
      space_id: state.space.id,
      sequence: state.sequence,
      event: evt
    }

    Thexr.QueueBroadcaster.async_notify({msg, event_stream_attrs})
    # TODO: every msg is broadcast to every client?
    # we can consolidate that to on 'need to know' basis
    broadcast_event(state.space, {msg, evt}, pid)

    {:noreply, state}
  end

  def handle_cast({:member_connected, member_id}, state) do
    new_disconnected = MapSet.delete(state.disconnected, member_id)
    state = %{state | disconnected: new_disconnected}
    {:noreply, state}
  end

  def handle_cast({:member_disconnected, member_id}, state) do
    new_disconnected = MapSet.put(state.disconnected, member_id)
    state = %{state | disconnected: new_disconnected}
    Process.send_after(self(), :kick_check, @kick_check_timeout)
    {:noreply, state}
  end

  def handle_call(:summary, _from, state) do
    {:reply, state, state, @timeout}
  end

  def handle_call(:get_ets_refs, _from, state) do
    {:reply, {state.member_movements, state.member_states}, state, @timeout}
  end

  def handle_info(:timeout, state) do
    {:noreply, state}
  end

  def handle_info(:kick_check, state) do
    Enum.each(state.disconnected, fn member_id ->
      time_in_ms = DateTime.utc_now() |> DateTime.to_unix(:millisecond)

      payload = %{
        m: EventName.atom_to_int(:member_left),
        p: %{member_id: member_id},
        ts: time_in_ms
      }

      __MODULE__.process_event(state.space.id, :member_left, payload, nil)
    end)

    state = %{state | disconnected: MapSet.new()}
    {:noreply, state}
  end

  def terminate({:shutdown, :timeout}, _game) do
    IO.inspect("space terminating from shutdown timeout")
    :ok
  end

  def terminate(_reason, _game) do
    IO.inspect("space terminating some other reason")
    :ok
  end

  def broadcast_event(space, {_msg, evt}, nil) do
    ThexrWeb.Endpoint.broadcast("space:#{space.id}", "event", evt)
  end

  def broadcast_event(space, {_msg, evt}, from) do
    ThexrWeb.Endpoint.broadcast_from(from, "space:#{space.id}", "event", evt)
  end
end
