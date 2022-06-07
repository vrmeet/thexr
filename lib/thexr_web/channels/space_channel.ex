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
  def handle_in("event", event_payload, socket) do
    {event_atom, atomized_event} =
      SpaceServer.process_event(socket.assigns.space_id, event_payload, self())

    # cache member movement if event is camera movement
    cache_members(event_atom, atomized_event.p, socket)
    {:noreply, socket}
  end

  def cache_members(
        :member_entered,
        %{member_id: member_id, pos_rot: pos_rot, state: member_state},
        socket
      ) do
    [px, py, pz] = pos_rot.pos
    [rx, ry, rz, rw] = pos_rot.rot

    :ets.insert(
      socket.assigns.member_movements,
      {member_id, {px, py, pz, rx, ry, rz, rw}}
    )

    :ets.insert(socket.assigns.member_states, {member_id, member_state})
  end

  def cache_members(
        :member_moved,
        %{member_id: member_id, pos_rot: pos_rot},
        socket
      ) do
    [px, py, pz] = pos_rot.pos
    [rx, ry, rz, rw] = pos_rot.rot

    :ets.insert(
      socket.assigns.member_movements,
      {member_id, {px, py, pz, rx, ry, rz, rw}}
    )
  end

  def cache_members(
        :member_changed_mic_pref,
        %{member_id: member_id, mic_muted: mic_muted},
        socket
      ) do
    payload = get_state(member_id, socket.assigns.member_states)

    state = Map.merge(payload, %{mic_muted: mic_muted})
    :ets.insert(socket.assigns.member_states, {member_id, state})
  end

  def cache_members(
        :member_changed_nickname,
        %{member_id: member_id, nickname: nickname},
        socket
      ) do
    payload = get_state(member_id, socket.assigns.member_states)

    state = Map.merge(payload, %{nickname: nickname})
    :ets.insert(socket.assigns.member_states, {member_id, state})
  end

  def cache_members(_, _, _) do
  end

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
          "states" => Thexr.Utils.member_states_to_map(member_states),
          "movements" => Thexr.Utils.movements_to_map(member_movements)
        })

        SpaceServer.member_connected(socket.assigns.space_id, socket.assigns.member_id)
        {:noreply, socket}
    end
  end

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
