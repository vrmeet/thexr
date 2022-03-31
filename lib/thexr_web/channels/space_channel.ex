defmodule ThexrWeb.SpaceChannel do
  use ThexrWeb, :channel
  alias ThexrWeb.Presence

  @impl true
  def join("space:" <> slug, _params, socket) do
    send(self(), :after_join)
    socket = assign(socket, :slug, slug)
    {:ok, %{agora_app_id: System.get_env("AGORA_APP_ID")}, socket}
  end

  @impl true
  def handle_in("command", [command_name, payload, time_in_ms], socket) do
    event = Thexr.CommandHandler.handle_command(command_name, payload, time_in_ms)
    Thexr.SpaceServer.process_event(socket.assigns.slug, event)
    {:noreply, socket}
  end

  def handle_in("camera_moved", %{"pos" => pos, "rot" => rot}, socket) do
    broadcast_from(socket, "member_moved", %{
      member_id: socket.assigns.member_id,
      pos: pos,
      rot: rot
    })

    [px, py, pz] = pos
    [rx, ry, rz, rw] = rot

    :ets.insert(
      socket.assigns.member_movements,
      {socket.assigns.member_id, {px, py, pz, rx, ry, rz, rw}}
    )

    {:noreply, socket}
  end

  def handle_in("spaces_api", %{"func" => func, "args" => args}, socket) do
    apply(Thexr.Spaces, String.to_atom(func), [socket.assigns.space | args])
    {:noreply, socket}
  end

  def handle_in("member_state_patched", patch, socket) do
    IO.inspect(patch, label: "what's the data")
    payload = get_state(socket.assigns.member_id, socket.assigns.member_states)
    state = Map.merge(payload, patch)
    :ets.insert(socket.assigns.member_states, {socket.assigns.member_id, state})

    broadcast(socket, "member_state_updated", %{
      "member_id" => socket.assigns.member_id,
      "state" => state
    })

    {:noreply, socket}
  end

  def handle_in("member_state_changed", state, socket) do
    :ets.insert(socket.assigns.member_states, {socket.assigns.member_id, state})

    broadcast(socket, "member_state_updated", %{
      "member_id" => socket.assigns.member_id,
      "state" => state
    })

    {:noreply, socket}
  end

  @impl true

  def handle_info(:after_join, socket) do
    {:ok, _} = Presence.track(socket, socket.assigns.member_id, %{})
    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end

  def handle_info(
        {:after_join,
         %{"pos_rot" => %{"pos" => [px, py, pz], "rot" => [rx, ry, rz, rw]}, "state" => state} =
           params},
        socket
      ) do
    case Thexr.SpaceServer.ets_refs(socket.assigns.slug) do
      {:error, _} ->
        push(socket, "server_lost", %{})
        {:noreply, socket}

      {member_movements, member_states} ->
        :ets.insert(member_states, {
          socket.assigns.member_id,
          state
        })

        :ets.insert(
          member_movements,
          {socket.assigns.member_id, {px, py, pz, rx, ry, rz, rw}}
        )

        {:ok, _} = Presence.track(socket, socket.assigns.member_id, %{})

        # tell existing members about us, so they can draw us as an avatar
        broadcast_from(
          socket,
          "new_member",
          Map.put(params, "member_id", socket.assigns.member_id)
        )

        # tell us about existing members, so we can draw their avatars
        push(socket, "members", %{
          "states" => member_states_to_map(member_states),
          "movements" => movements_to_map(member_movements)
        })

        socket = assign(socket, member_movements: member_movements)
        socket = assign(socket, member_states: member_states)

        space = Thexr.Spaces.get_space_by_slug(socket.assigns.slug)
        socket = assign(socket, space: space)
        {:noreply, socket}
    end
  end

  @impl true
  def terminate(_reason, socket) do
    try do
      if socket.assigns.member_movements do
        :ets.delete(socket.assigns.member_movements, socket.assigns.member_id)
      end

      if socket.assigns.member_states do
        :ets.delete(socket.assigns.member_states, socket.assigns.member_id)
      end
    rescue
      _e ->
        push(socket, "server_lost", %{})
    end

    {:noreply, socket}
  end

  def member_states_to_map(ets_ref) do
    :ets.tab2list(ets_ref)
    |> Enum.reduce(%{}, fn {member_id, payload}, acc ->
      Map.put(acc, member_id, payload)
    end)
  end

  def movements_to_map(ets_ref) do
    :ets.tab2list(ets_ref)
    |> Enum.reduce(%{}, fn {member_id, {p0, p1, p2, r0, r1, r2, r3}}, acc ->
      payload = %{
        "pos_rot" => %{
          "pos" => [p0, p1, p2],
          "rot" => [r0, r1, r2, r3]
        }
      }

      Map.put(acc, member_id, payload)
    end)
  end

  # def get_pos_rot(member_id, ets_ref) do
  #   case :ets.lookup(ets_ref, member_id) do
  #     [{^member_id, {p0, p1, p2, r0, r1, r2, r3}}] ->
  #       %{
  #         "pos_rot" => %{
  #           "pos" => [p0, p1, p2],
  #           "rot" => [r0, r1, r2, r3]
  #         }
  #       }

  #     _ ->
  #       %{"error" => "not_found"}
  #   end
  # end

  def get_state(member_id, ets_ref) do
    case :ets.lookup(ets_ref, member_id) do
      [{^member_id, payload}] ->
        payload

      _ ->
        {:error, "not_found"}
    end
  end
end
