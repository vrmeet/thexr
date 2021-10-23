defmodule ThexrWeb.SpaceLive.Show do
  use ThexrWeb, :live_view

  alias Thexr.Spaces
  alias Thexr.Spaces.Entity

  @impl true
  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_params(%{"id" => id}, _, socket) do
    {:noreply,
     socket
     |> assign(:page_title, page_title(socket.assigns.live_action))
     |> assign(:space, Spaces.get_space_with_entities!(id))}
  end

  defp page_title(:show), do: "Show Space"
  defp page_title(:edit), do: "Edit Space"

  @impl true
  def handle_event("add_entity", %{"entity_kind" => entity_kind}, socket) do
    attrs = %{space_id: socket.assigns.space.id, name: "my-entity", type: entity_kind}
    Spaces.create_entity(attrs)
    space_with_entities = Spaces.get_space_with_entities!(socket.assigns.space.id)
    {:noreply, assign(socket, :space, space_with_entities)}
  end

  def handle_event("delete_entity", %{"entity_id" => entity_id}, socket) do
    Spaces.delete_entity(%Entity{id: entity_id})
    space_with_entities = Spaces.get_space_with_entities!(socket.assigns.space.id)
    {:noreply, assign(socket, :space, space_with_entities)}
  end
end
