defmodule ThexrWeb.SpaceChannel do
  use ThexrWeb, :channel
  alias ThexrWeb.Presence

  @impl true
  def join("space:" <> slug, params, socket) do
    send(self(), {:after_join, params})
    socket = assign(socket, :slug, slug)
    {:ok, %{"hi" => "there", "slug" => slug}, socket}
  end

  @impl true
  def handle_in("hi", _, socket) do
    broadcast(socket, "sup", %{"my" => "msg"})
    {:noreply, socket}
  end

  @impl true
  def handle_info({:after_join, params}, socket) do
    ets_ref = Thexr.SpaceServer.ets_ref(socket.assigns.slug)

    :ets.insert(
      ets_ref,
      {socket.assigns.member_id, params}
    )

    {:ok, _} = Presence.track(socket, socket.assigns.member_id, %{})

    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end
end
