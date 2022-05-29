defmodule Thexr.EventWriter do
  use GenStage

  @archive_chuck_size 100

  def start_link([]) do
    GenStage.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    client = create_aws_client()
    env_name = Application.get_env(:thexr, :environment_name)

    {:consumer, %{aws_client: client, env_name: env_name},
     subscribe_to: [{Thexr.QueueBroadcaster, max_demand: 5, min_demand: 2}]}
  end

  def create_aws_client do
    if System.get_env("AWS_ACCESS_KEY_ID") do
      # likely to have the secret and region too
      AWS.Client.create()
    else
      nil
    end
  end

  def handle_events(events, _from, state) do
    # TODO: write all events in bulk

    Enum.map(events, fn event ->
      Thexr.Spaces.create_event(event)

      if rem(event.sequence, @archive_chuck_size) == 0 do
        Thexr.Spaces.batch_archive_eventstream_to_s3(
          event.space_id,
          event.sequence,
          @archive_chuck_size,
          state.aws_client
        )
      end

      # side-effect of processing each event into a snapshot
      Thexr.Snapshot.process(event.space_id, event.type, event)
    end)

    # We are a consumer, so we would never emit items.
    {:noreply, [], state}
  end
end
