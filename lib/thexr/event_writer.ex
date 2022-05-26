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

    Enum.map(events, fn event ->
      # Thexr.Spaces.create_event(event)
      # side-effect of processing each event into a snapshot
      Thexr.Snapshot.process(event.space_id, event.type, event)
      # return value is a entry for eventbridge
      # create_sqs_entry(
      #   "#{event.space_id}##{event.sequence}",
      #   Jason.encode!(event),
      #   event.space_id
      # )

      input = %{
        "QueueUrl" => "https://sqs.us-west-2.amazonaws.com/426932470747/ThexrEventQueue.fifo",
        "MessageBody" => Jason.encode!(event),
        "MessageDeduplicationId" => event.sequence,
        "MessageGroupId" => event.space_id
      }

      AWS.SQS.send_message(state.aws_client, input) |> IO.inspect(label: "send message")
    end)

    #   |> Enum.chunk_every(10, 10, [])
    #   |> Enum.each(fn batch ->
    #     #   IO.inspect(batch, label: "batch")
    #     input = %{
    #       "Entries" => batch,
    #       "QueueUrl" => "https://sqs.us-west-2.amazonaws.com/426932470747/ThexrEventQueue.fifo"
    #     }

    #     IO.inspect(input, label: "input")

    #     AWS.SQS.send_message_batch(state.aws_client, input) |> IO.inspect(label: "send_message")
    #     # meta = Map.put(AWS.SQS.metadata(), :protocol, "json")

    #     # AWS.Request.request_post(state.aws_client, meta, "SendMessageBatch", input, [])
    #     # |> IO.inspect(label: "post")
    #   end)

    # # AWS.EventBridge.put_events(state.aws_client, %{"Entries" => entries})
    # |> IO.inspect(label: "put_event")

    # input = %{
    #   "EndpointId" => "" ,
    #   "Entries" =>  []
    # }
    # AWS.EventBridge.put_events(state.aws_client, input, options)

    # We are a consumer, so we would never emit items.
    {:noreply, [], state}
  end

  # id - identifies the unique message
  # message_body json string
  def create_sqs_entry(id, message_body, group_id) do
    # %{
    #   "Id" => id,
    #   "MessageBody" => message_body,
    #   "MessageDeduplicationId" => group_id,
    #   "MessageGroupId" => group_id
    # }
    %{
      "Id" => id,
      "MessageBody" => message_body,
      "MessageDeduplicationId" => group_id,
      "MessageGroupId" => group_id
    }

    # [
    #   "Id=#{id}",
    #   "MessageBody=#{message_body}",
    #   "MessageDeduplicationId=#{group_id}",
    #   "MessageGroupId=#{group_id}"
    # ]
    # |> Enum.join(",")
  end
end
