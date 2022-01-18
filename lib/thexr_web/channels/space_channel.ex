defmodule ThexrWeb.SpaceChannel do
  use ThexrWeb, :channel
  alias ThexrWeb.Presence

  @impl true
  def join("space:" <> slug, _params, socket) do
    send(self(), :after_join)
    {:ok, %{"hi" => "there", "slug" => slug}, socket}
  end

  @impl true
  def handle_in("hi", _, socket) do
    broadcast(socket, "sup", %{"my" => "msg"})
    {:noreply, socket}
  end

  @impl true
  def handle_info(:after_join, socket) do
    {:ok, _} = Presence.track(socket, socket.assigns.member_id, %{})

    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end
end
