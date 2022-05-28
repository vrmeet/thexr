defmodule Thexr.EventWriter do
  use GenStage

  def start_link([]) do
    GenStage.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    client = create_aws_client()
    env_name = Application.get_env(:thexr, :environment_name)
    sqs_url = System.get_env("SQS_FIFO_EVENT_QUEUE_URL")

    {:consumer, %{aws_client: client, env_name: env_name, sqs_url: sqs_url},
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
      # Thexr.Spaces.create_event(event)
      # side-effect of processing each event into a snapshot
      Thexr.Snapshot.process(event.space_id, event.type, event)
      Thexr.Spaces.set_max_event_sequence(event.space_id, event.sequence)
      # return value is a entry for eventbridge
      # create_sqs_entry(
      #   "#{event.space_id}##{event.sequence}",
      #   Jason.encode!(event),
      #   event.space_id
      # )

      if state.aws_client != nil do
        input = %{
          "QueueUrl" => state.sqs_url,
          "MessageBody" => Jason.encode!(event),
          "MessageDeduplicationId" => event.sequence,
          "MessageGroupId" => event.space_id
        }

        AWS.SQS.send_message(state.aws_client, input)
      end
    end)

    # |> Enum.chunk_every(10, 10, [])
    # |> Enum.each(fn batch ->
    #   #   IO.inspect(batch, label: "batch")
    #   input = %{
    #     "Entries" => Jason.encode!(batch),
    #     "QueueUrl" => state.sqs_url
    #   }

    #   IO.inspect(input, label: "input")

    #   AWS.SQS.send_message_batch(state.aws_client, input) |> IO.inspect(label: "send_message")
    # end)

    # We are a consumer, so we would never emit items.
    {:noreply, [], state}
  end

  # id - identifies the unique message
  # message_body json string
  def create_sqs_entry(id, message_body, group_id) do
    %{
      "Id" => id,
      "MessageBody" => message_body,
      "MessageDeduplicationId" => group_id,
      "MessageGroupId" => group_id
    }
  end
end
