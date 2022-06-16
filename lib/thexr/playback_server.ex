defmodule Thexr.PlaybackServer do
  use GenServer
  require Logger

  # Client (Public) Interface

  @doc """
  Spawns a new space server process registered under the given `space.id`.
  options are passed to initialize the space state
  """
  def start_link(opts) do
    GenServer.start_link(
      __MODULE__,
      {:ok, opts}
    )
  end

  @buffer_size 20

  #################################################################
  # Server Callbacks
  #################################################################

  def init(
        {:ok,
         %{
           space_id: space_id,
           start_seq: beginning_sequence,
           end_seq: ending_sequence
         }}
      ) do
    case Thexr.Spaces.event_stream(space_id,
           last_evaluated_sequence: beginning_sequence,
           limit: @buffer_size
         ) do
      [] ->
        :ignore

      [first | rest] ->
        send(self(), {:stream_entry, first})

        {:ok,
         %{
           space_id: space_id,
           end_seq: ending_sequence,
           stream_entries: rest,
           last_timestamp: first.event["ts"],
           client: AWS.Client.create()
         }}
    end

    # todo, terminate if events empty
    # first_event_time = List.first(events).event_timestamp
    # Enum.each(events, fn event ->
    #   Process.send_after(self(), {:event, event})
    # end)
    # when to play 2nd event (how long to wait?)
  end

  def handle_info({:stream_entry, stream_entry}, state) do
    modified_payload = modify_payload(stream_entry.event["p"])

    payload = %{
      stream_entry.event
      | "p" => modified_payload,
        "ts" => :os.system_time(:millisecond)
    }

    # payload = %{"m" => event.type, "p" => modified_payload, "ts" => :os.system_time(:millisecond)}
    Thexr.SpaceServer.process_event(state.space_id, payload, nil)

    if stream_entry.sequence >= state.end_seq do
      IO.inspect("exiting playback, hit last event of #{stream_entry.sequence}")

      Process.exit(self(), :done)
    end

    case state.stream_entries do
      [] ->
        IO.inspect("exiting playback, no further events")
        Process.exit(self(), :done)

      [first | rest] ->
        rest =
          case rest do
            [] ->
              Thexr.Spaces.event_stream(state.space_id,
                last_evaluated_sequence: first.sequence,
                limit: @buffer_size
              )

            _ ->
              rest
          end

        # first.event_timestamp - state.last_timestamp
        Process.send_after(self(), {:stream_entry, first}, 100)
        {:noreply, %{state | stream_entries: rest, last_timestamp: first.event["ts"]}}
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
