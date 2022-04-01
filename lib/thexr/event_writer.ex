defmodule Thexr.EventWriter do
  use GenStage

  def start_link([]) do
    GenStage.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    {:consumer, :the_state_does_not_matter,
     subscribe_to: [{Thexr.QueueBroadcaster, max_demand: 100, min_demand: 50}]}
  end

  def handle_events(events, _from, state) do
    IO.inspect(events, label: "event writer receiving events")
    # TODO: write all events in bulk
    Enum.map(events, fn event ->
      Thexr.Spaces.create_event(event) |> IO.inspect(label: "create_event")
    end)

    # We are a consumer, so we would never emit items.
    {:noreply, [], state}
  end
end
