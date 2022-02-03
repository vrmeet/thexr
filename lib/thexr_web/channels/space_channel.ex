defmodule ThexrWeb.SpaceChannel do
  use ThexrWeb, :channel
  alias ThexrWeb.Presence

  @impl true
  def join("space:" <> slug, params, socket) do
    send(self(), {:after_join, params})
    socket = assign(socket, :slug, slug)
    {:ok, %{agora_app_id: System.get_env("AGORA_APP_ID")}, socket}
  end

  @impl true
  def handle_in("camera_moved", %{"pos" => pos, "rot" => rot}, socket) do
    broadcast_from(socket, "member_moved", %{
      member_id: socket.assigns.member_id,
      pos: pos,
      rot: rot
    })

    [px, py, pz] = pos
    [rx, ry, rz, rw] = rot

    :ets.insert(
      socket.assigns.ets_ref,
      {socket.assigns.member_id, {px, py, pz, rx, ry, rz, rw}}
    )

    {:noreply, socket}
  end

  @impl true
  @spec handle_info({:after_join, map}, Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()}
  def handle_info(
        {:after_join,
         %{"pos_rot" => %{"pos" => [px, py, pz], "rot" => [rx, ry, rz, rw]}} = pos_rot},
        socket
      ) do
    case Thexr.SpaceServer.ets_ref(socket.assigns.slug) do
      {:error, _} ->
        push(socket, "server_lost", %{})
        {:noreply, socket}

      ets_ref ->
        :ets.insert(
          ets_ref,
          {socket.assigns.member_id, {px, py, pz, rx, ry, rz, rw}}
        )

        {:ok, _} = Presence.track(socket, socket.assigns.member_id, pos_rot)

        push(socket, "presence_state", Presence.list(socket))
        socket = assign(socket, ets_ref: ets_ref)
        {:noreply, socket}
    end
  end
end
