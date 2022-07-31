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

  def agents(space_id) do
    GenServer.call(via_tuple(space_id), :agents)
  end

  # about this space
  def about(space_id) do
    GenServer.call(via_tuple(space_id), :about)
  end

  def state(space_id) do
    GenServer.call(via_tuple(space_id), :state)
  end

  def member_movements(space_id) do
    {member_movements, _} = ets_refs(space_id)
    Thexr.Utils.movements_to_map(member_movements)
  end

  def member_states(space_id) do
    {_, member_states} = ets_refs(space_id)
    Thexr.Utils.member_states_to_map(member_states)
  end

  # space channel calls this after join
  def member_connected(space_id, member_id) do
    GenServer.cast(via_tuple(space_id), {:member_connected, member_id})
  end

  # space channel calls this on terminate
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
       disconnected: MapSet.new(),
       leader: nil,
       agents: %{},
       entities: %{},
       used: %{}
     }, @timeout}
  end

  def forward_to_ledger(state, event_atom_name, evt) do
    state = %{state | sequence: state.sequence + 1}

    event_stream_attrs = %{
      space_id: state.space.id,
      sequence: state.sequence,
      event: evt
    }

    Thexr.QueueBroadcaster.async_notify({event_atom_name, event_stream_attrs})
    state
  end

  # def handle_event(event_name_atom, atomized_event, nil, state) do
  #   forward_to_ledger(event_name_atom, atomized_event, state)
  #   broadcast_event(state.space, event_name_atom, atomized_event, nil)
  #   {:noreply, state}
  # end

  # def handle_event(event_name_atom, atomized_event, pid, state) when is_pid(pid) do
  #   forward_to_ledger(event_name_atom, atomized_event, state)
  #   broadcast_event(state.space, event_name_atom, atomized_event, pid)
  #   {:noreply, state}
  # end

  def handle_event_and_broadcast_others(state, {:event, event_name_atom, atomized_event, pid}) do
    state = forward_to_ledger(state, event_name_atom, atomized_event)
    broadcast_event_to_others(state.space.id, atomized_event, pid)
    IO.inspect(state, label: "new state")
    {:noreply, state}
  end

  def handle_event_and_broadcast_all(state, {:event, event_name_atom, atomized_event, _pid}) do
    state = forward_to_ledger(state, event_name_atom, atomized_event)
    broadcast_event_to_all(state.space.id, atomized_event)

    {:noreply, state}
  end

  def save_last_event_for_entity(state, {:event, _event_name_atom, atomized_event, _pid} = tuple) do
    entity_id = atomized_event.p.entity_id
    new_entities = Map.put(state.entities, entity_id, atomized_event)

    state
    |> Map.put(:entities, new_entities)
    |> handle_event_and_broadcast_others(tuple)
  end

  def handle_cast({:event, :entity_grabbed, _evt, _pid} = tuple, state) do
    save_last_event_for_entity(state, tuple)
  end

  def handle_cast({:event, :entity_released, _evt, _pid} = tuple, state) do
    save_last_event_for_entity(state, tuple)
  end

  def handle_cast({:event, :entity_collected, _evt, _pid} = tuple, state) do
    save_last_event_for_entity(state, tuple)
  end

  def handle_cast({:event, :entity_animated_offset, _evt, _pid} = tuple, state) do
    save_last_event_for_entity(state, tuple)
  end

  def handle_cast({:event, :member_entered, evt, _pid} = tuple, state) do
    if state.leader == nil || state.leader == evt.p.member_id do
      ThexrWeb.Endpoint.broadcast("space:#{state.space.id}", "new_leader", %{
        member_id: evt.p.member_id
      })
    end

    state =
      if state.leader == nil do
        %{state | leader: evt.p.member_id}
      else
        state
      end

    handle_event_and_broadcast_others(state, tuple)
  end

  def handle_cast({:event, :member_respawned, _, _} = tuple, state) do
    handle_event_and_broadcast_all(state, tuple)
  end

  def handle_cast({:event, :agent_spawned, evt, _pid} = tuple, state) do
    # save agents
    state = %{
      state
      | agents: Map.put(state.agents, evt.p.name, %{position: evt.p.position})
    }

    handle_event_and_broadcast_all(state, tuple)
  end

  def handle_cast({:event, :agent_hit, evt, _pid} = tuple, state) do
    state = %{state | agents: Map.delete(state.agents, evt.p.name)}
    handle_event_and_broadcast_others(state, tuple)
  end

  def handle_cast({:event, :agent_directed, %{p: payload}, _pid} = tuple, state) do
    updated_agents = Map.put(state.agents, payload.name, Map.delete(payload, :name))

    state = %{state | agents: updated_agents}
    # putting nil into last element of tuple forces handle event to broadcast back to self
    handle_event_and_broadcast_all(state, tuple)
  end

  def handle_cast({:event, :agent_stopped, %{p: payload}, _pid} = tuple, state) do
    updated_agents = Map.put(state.agents, payload.name, Map.delete(payload, :name))

    state = %{state | agents: updated_agents}
    # putting nil into last element of tuple forces handle event to broadcast back to self
    handle_event_and_broadcast_all(state, tuple)
  end

  def handle_cast({:event, :agent_attacked_member, _, _} = tuple, state) do
    handle_event_and_broadcast_all(state, tuple)
  end

  def handle_cast({:event, :member_left, evt, _pid} = tuple, state) do
    member_ids = Thexr.Utils.member_states_to_map(state.member_states) |> Map.keys()

    state =
      if length(member_ids) > 0 do
        if evt.p.member_id == state.leader do
          # assign new leader if previous leader left
          member_id = List.first(member_ids)

          ThexrWeb.Endpoint.broadcast("space:#{state.space.id}", "new_leader", %{
            member_id: member_id
          })

          %{state | leader: member_id}
        else
          state
        end
      else
        # if all members left, clear leader and agents
        %{state | leader: nil, agents: %{}}
      end

    handle_event_and_broadcast_all(state, tuple)
  end

  def handle_cast({:event, _, _, _} = tuple, state) do
    handle_event_and_broadcast_others(state, tuple)
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

  def handle_call(:state, _from, state) do
    {:reply, state, state, @timeout}
  end

  def handle_call(:about, _form, state) do
    response = Map.take(state, ~W|agents entities used|a)
    {:reply, response, state, @timeout}
  end

  def handle_call(:agents, _from, state) do
    {:reply, state.agents, state, @timeout}
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

  def broadcast_event_to_all(space_id, evt) do
    ThexrWeb.Endpoint.broadcast("space:#{space_id}", "event", evt)
  end

  def broadcast_event_to_others(space_id, evt, from) do
    if from == nil do
      # fall back to broadcast all
      broadcast_event_to_all(space_id, evt)
    else
      ThexrWeb.Endpoint.broadcast_from(from, "space:#{space_id}", "event", evt)
    end
  end

  # def choose_leader(:member_entered, evt, state) do
  #   if state.leader == nil do
  #     ThexrWeb.Endpoint.broadcast("space:#{state.space.id}", "new_leader", %{
  #       member_id: evt.p.member_id
  #     })

  #     %{state | leader: evt.p.member_id}
  #   else
  #     state
  #   end
  # end

  def choose_leader(:member_left, evt, state) do
    if evt.p.member_id == state.leader do
      # find a new leader
      member_ids = Thexr.Utils.member_states_to_map(state.member_states) |> Map.keys()

      if length(member_ids) > 0 do
        member_id = List.first(member_ids)

        ThexrWeb.Endpoint.broadcast("space:#{state.space.id}", "new_leader", %{
          member_id: member_id
        })

        %{state | leader: member_id}
      else
        %{state | leader: nil}
      end
    else
      state
    end
  end

  def choose_leader(_, _, state) do
    state
  end
end
