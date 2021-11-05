defmodule ThexrWeb.ComponentLive.Show do
  use ThexrWeb, :live_view

  alias Thexr.Spaces

  @impl true
  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_params(%{"id" => id}, _, socket) do
    {:noreply,
     socket
     |> assign(:page_title, page_title(socket.assigns.live_action))
     |> assign(:component, Spaces.get_component!(id))}
  end

  defp page_title(:show), do: "Show Component"
  defp page_title(:edit), do: "Edit Component"
end
