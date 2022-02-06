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

  def handle_in("spaces_api", %{"func" => func, "args" => args}, socket) do
    apply(Thexr.Spaces, String.to_atom(func), [socket.assigns.space | args])
    {:noreply, socket}
  end

  @impl true
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

        space = Thexr.Spaces.get_space_by_slug(socket.assigns.slug)
        socket = assign(socket, space: space)
        {:noreply, socket}
    end
  end
end
