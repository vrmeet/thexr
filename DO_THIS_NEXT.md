TODO:

- make a space channel (elixir)
- client connect to the channel

- send messages related to entity/component changes



- After entity is created, view the entity in the scene.
- Any connected clients get the updates too

   VRMeetWeb.Endpoint.broadcast(
      "space:#{space.slug}",
      "rpc_request",
      command
    )
- ability to delete entity


