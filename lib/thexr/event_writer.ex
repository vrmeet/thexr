defmodule Thexr.EventWriter do
  use GenStage

  def start_link([]) do
    GenStage.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    {:consumer, :the_state_does_not_matter,
     subscribe_to: [{Thexr.QueueBroadcaster, max_demand: 5, min_demand: 2}]}
  end

  def handle_events(events, _from, state) do
    # TODO: write all events in bulk
    Enum.map(events, fn event ->
      # Thexr.Spaces.create_event(event)
      Thexr.Snapshot.process(event.space_id, event.type, event)
    end)

    # We are a consumer, so we would never emit items.
    {:noreply, [], state}
  end
end
