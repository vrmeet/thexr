defmodule ThexrWeb.SpaceChannel do
  use ThexrWeb, :channel

  @impl true
  def join("space:" <> slug, _params, socket) do
    {:ok, %{"hi" => "there", "slug" => slug}, socket}
  end

  @impl true
  def handle_in("hi", _, socket) do
    broadcast(socket, "sup", %{"my" => "msg"})
    {:noreply, socket}
  end
end
