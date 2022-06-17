defmodule Thexr.PlaybackServer do
  use GenServer, restart: :temporary
  require Logger

  # Client (Public) Interface

  def start_link({source_space_id, target_space_id, start_seq, end_seq}) do
    IO.inspect("booting up playback server")
    start_link(source_space_id, target_space_id, start_seq, end_seq, true)
  end

  @doc """
  Spawns a new space server process registered under the given target space id
  opts:
  source_space_id: source_space_id,
  target_space_id: target_space_id
  start_seq: beginning_sequence,
  end_seq: ending_sequence
  """
  def start_link(source_space_id, target_space_id, start_seq, end_seq, autoplay \\ false) do
    # make sure there is a process to receive the events
    Thexr.SpaceSupervisor.start_space(target_space_id)

    GenServer.start_link(
      __MODULE__,
      {:ok,
       %{
         source_space_id: source_space_id,
         target_space_id: target_space_id,
         start_seq: start_seq,
         end_seq: end_seq,
         autoplay: autoplay
       }},
      name: via_tuple(target_space_id)
    )
  end

  def next(target_space_id) do
    GenServer.call(via_tuple(target_space_id), :next)
  end

  def stop(target_space_id) do
    GenServer.call(via_tuple(target_space_id), :stop)
  end

  def pid(space_id) do
    space_id
    |> via_tuple()
    |> GenServer.whereis()
  end

  def via_tuple(space_id) do
    {:via, Registry, {Thexr.SpacePlaybackRegistry, space_id}}
  end

  #################################################################
  # Server Callbacks
  #################################################################

  def init(
        {:ok,
         %{
           source_space_id: source_space_id,
           target_space_id: target_space_id,
           start_seq: start_seq,
           end_seq: end_seq,
           autoplay: autoplay
         }}
      ) do
    IO.inspect("in init of playback server")

    case Thexr.Spaces.event_stream(source_space_id, start_seq - 1) do
      [] ->
        :ignore

      [first | rest] ->
        entries =
          if autoplay == true do
            send(self(), {:stream_entry, first})
            rest
          else
            [first | rest]
          end

        {:ok,
         %{
           source_space_id: source_space_id,
           target_space_id: target_space_id,
           end_seq: end_seq,
           stream_entries: entries,
           last_timestamp: nil,
           client: AWS.Client.create(),
           autoplay: autoplay
         }}
    end

    # todo, terminate if events empty
    # first_event_time = List.first(events).event_timestamp
    # Enum.each(events, fn event ->
    #   Process.send_after(self(), {:event, event})
    # end)
    # when to play 2nd event (how long to wait?)
  end

  def handle_call(:next, _from, state) do
    IO.inspect("in next")

    case state.stream_entries do
      [] ->
        {:stop, :normal, :no_events, state}

      [first | rest] ->
        send(self(), {:stream_entry, first})
        state = %{state | stream_entries: rest}
        {:reply, :ok, state}
    end
  end

  def handle_call(:stop, _from, state) do
    {:stop, :normal, :stop, state}
  end

  def handle_info({:stream_entry, stream_entry}, state) do
    # enhances member_id and entity_id into another uuid to avoid conflicting with existing
    # entities and members already in the space during playback
    modified_payload = modify_payload(stream_entry.event["p"])

    payload = %{
      stream_entry.event
      | "p" => modified_payload,
        "ts" => :os.system_time(:millisecond)
    }

    Thexr.SpaceServer.process_event(state.target_space_id, payload, nil)
    stream_entry |> IO.inspect(label: "handling stream event")

    IO.inspect("comparing stream entry sequence #{stream_entry.sequence} and #{state.end_seq}")

    cond do
      stream_entry.sequence >= state.end_seq ->
        IO.inspect("exiting playback, hit last event of #{stream_entry.sequence}")

        {:stop, :normal, state}

      true ->
        case state.stream_entries do
          [] ->
            {:stop, :normal, state}

          [first | rest] ->
            rest =
              case rest do
                [] ->
                  Thexr.Spaces.event_stream(state.source_space_id, first.sequence)

                _ ->
                  rest
              end

            if state.autoplay do
              # first.event_timestamp - state.last_timestamp
              Process.send_after(self(), {:stream_entry, first}, 1000)
              {:noreply, %{state | stream_entries: rest, last_timestamp: first.event["ts"]}}
            else
              {:noreply, %{state | stream_entries: [first | rest]}}
            end
        end
    end
  end

  def modify_payload(payload) do
    Enum.reduce(payload, %{}, fn {k, v}, acc ->
      if k == "id" || String.ends_with?(k, "_id") do
        Map.merge(acc, %{k => UUID.uuid3(nil, v)})
      else
        Map.merge(acc, %{k => v})
      end
    end)
  end
end
