defmodule Thexr.EventWriter do
  use GenStage

  def start_link([]) do
    GenStage.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    client = AWS.Client.create()
    env_name = Application.get_env(:thexr, :environment_name)

    {:consumer, %{aws_client: client, env_name: env_name},
     subscribe_to: [{Thexr.QueueBroadcaster, max_demand: 5, min_demand: 2}]}
  end

  def handle_events(events, _from, state) do
    # TODO: write all events in bulk
    entries =
      Enum.map(events, fn event ->
        # Thexr.Spaces.create_event(event)
        # side-effect of processing each event into a snapshot
        Thexr.Snapshot.process(event.space_id, event.type, event)
        # return value is a entry for eventbridge
        %{
          "Source" => state.env_name,
          "DetailType" => "event",
          "Detail" => Jason.encode!(event),
          "EventBusName" => "ThexrEventBus"
        }
      end)

    AWS.EventBridge.put_events(state.aws_client, %{"Entries" => entries})
    |> IO.inspect(label: "put_event")

    # input = %{
    #   "EndpointId" => "" ,
    #   "Entries" =>  []
    # }
    # AWS.EventBridge.put_events(state.aws_client, input, options)

    # We are a consumer, so we would never emit items.
    {:noreply, [], state}
  end
end
