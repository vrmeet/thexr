defmodule ThexrWeb.SpaceChannel do
  use ThexrWeb, :channel
  alias ThexrWeb.Presence

  alias Thexr.SpaceServer

  @impl true
  def join("space:" <> space_id, params, socket) do
    send(self(), {:after_join, params})
    socket = assign(socket, :space_id, space_id)
    {:ok, %{agora_app_id: System.get_env("AGORA_APP_ID")}, socket}
  end

  @impl true
  def handle_in("event", payload, socket) do
    SpaceServer.process_event(socket.assigns.space_id, payload, self())
    # cache member movement if event is camera movement
    cache_members(payload, socket)
    {:noreply, socket}
  end

  def cache_members(
        %{
          "m" => "member_entered",
          "p" => %{"member_id" => member_id, "pos_rot" => pos_rot, "state" => member_state}
        },
        socket
      ) do
    [px, py, pz] = pos_rot["pos"]
    [rx, ry, rz, rw] = pos_rot["rot"]

    :ets.insert(
      socket.assigns.member_movements,
      {member_id, {px, py, pz, rx, ry, rz, rw}}
    )

    :ets.insert(socket.assigns.member_states, {member_id, member_state})
  end

  def cache_members(
        %{"m" => "member_moved", "p" => %{"member_id" => member_id, "pos_rot" => pos_rot}},
        socket
      ) do
    [px, py, pz] = pos_rot["pos"]
    [rx, ry, rz, rw] = pos_rot["rot"]

    :ets.insert(
      socket.assigns.member_movements,
      {member_id, {px, py, pz, rx, ry, rz, rw}}
    )
  end

  def cache_members(
        %{
          "m" => "member_changed_mic_pref",
          "p" => %{"member_id" => member_id, "mic_muted" => mic_muted}
        },
        socket
      ) do
    payload = get_state(member_id, socket.assigns.member_states)

    state = Map.merge(payload, %{"mic_muted" => mic_muted})
    :ets.insert(socket.assigns.member_states, {member_id, state})
  end

  def cache_members(_, _) do
  end

  # def handle_in("camera_moved", %{"pos" => pos, "rot" => rot}, socket) do
  #   broadcast_from(socket, "member_moved", %{
  #     member_id: socket.assigns.member_id,
  #     pos: pos,
  #     rot: rot
  #   })

  #   [px, py, pz] = pos
  #   [rx, ry, rz, rw] = rot

  #   :ets.insert(
  #     socket.assigns.member_movements,
  #     {socket.assigns.member_id, {px, py, pz, rx, ry, rz, rw}}
  #   )

  #   {:noreply, socket}
  # end

  # def handle_in("spaces_api", %{"func" => func, "args" => args}, socket) do
  #   apply(Thexr.Spaces, String.to_atom(func), [socket.assigns.space | args])
  #   {:noreply, socket}
  # end

  # def handle_in("member_state_patched", patch, socket) do
  #   # IO.inspect(patch, label: "what's the data")
  #   payload = get_state(socket.assigns.member_id, socket.assigns.member_states)
  #   state = Map.merge(payload, patch)
  #   :ets.insert(socket.assigns.member_states, {socket.assigns.member_id, state})

  #   broadcast(socket, "member_state_updated", %{
  #     "member_id" => socket.assigns.member_id,
  #     "state" => state
  #   })

  #   {:noreply, socket}
  # end

  # def handle_in("member_state_changed", state, socket) do
  #   :ets.insert(socket.assigns.member_states, {socket.assigns.member_id, state})

  #   broadcast(socket, "member_state_updated", %{
  #     "member_id" => socket.assigns.member_id,
  #     "state" => state
  #   })

  #   {:noreply, socket}
  # end

  @impl true

  def handle_info({:after_join, params}, socket) do
    case Thexr.SpaceServer.ets_refs(socket.assigns.space_id) do
      {:error, _} ->
        push(socket, "server_lost", %{})
        {:noreply, socket}

      {member_movements, member_states} ->
        socket = assign(socket, member_movements: member_movements, member_states: member_states)
        {:ok, _} = Presence.track(socket, socket.assigns.member_id, params)
        push(socket, "presence_state", Presence.list(socket))

        # TODO, move this to after member_entered? received
        push(socket, "about_members", %{
          "states" => member_states_to_map(member_states),
          "movements" => movements_to_map(member_movements)
        })

        SpaceServer.member_connected(socket.assigns.space_id, socket.assigns.member_id)
        {:noreply, socket}
    end
  end

  # def handle_info(
  #       {:after_join,
  #        %{"pos_rot" => %{"pos" => [px, py, pz], "rot" => [rx, ry, rz, rw]}, "state" => state} =
  #          params},
  #       socket
  #     ) do
  #   case Thexr.SpaceServer.ets_refs(socket.assigns.space_id) do
  #     {:error, _} ->
  #       push(socket, "server_lost", %{})
  #       {:noreply, socket}

  #     {member_movements, member_states} ->
  #       :ets.insert(member_states, {
  #         socket.assigns.member_id,
  #         state
  #       })

  #       :ets.insert(
  #         member_movements,
  #         {socket.assigns.member_id, {px, py, pz, rx, ry, rz, rw}}
  #       )

  #       {:ok, _} = Presence.track(socket, socket.assigns.member_id, %{})

  #       # tell existing members about us, so they can draw us as an avatar
  #       broadcast_from(
  #         socket,
  #         "new_member",
  #         Map.put(params, "member_id", socket.assigns.member_id)
  #       )

  #       # tell us about existing members, so we can draw their avatars
  #       push(socket, "members", %{
  #         "states" => member_states_to_map(member_states),
  #         "movements" => movements_to_map(member_movements)
  #       })

  #       socket = assign(socket, member_movements: member_movements)
  #       socket = assign(socket, member_states: member_states)

  #       space = Thexr.Spaces.get_space_by_id(socket.assigns.space_id)
  #       socket = assign(socket, space: space)
  #       {:noreply, socket}
  #   end
  # end

  @impl true
  def terminate(_reason, socket) do
    if socket.assigns.member_id && socket.assigns.space_id do
      SpaceServer.member_disconnected(socket.assigns.space_id, socket.assigns.member_id)
    end

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
