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
     |> assign(:space, Spaces.get_space!(id))
     |> assign(:selected_entity_id, nil)
     |> assign(:selected_previous_entity_id, nil)
     |> assign(:entities, Spaces.get_space_top_level_entities!(id))}
  end

  defp page_title(:show), do: "Show Space"
  defp page_title(:edit), do: "Edit Space"

  @impl true
  def handle_event("add_entity", %{"entity_kind" => entity_kind}, socket) do
    attrs = %{space_id: socket.assigns.space.id, type: entity_kind}
    Spaces.create_entity(attrs)
    entities = Spaces.get_space_top_level_entities!(socket.assigns.space.id)
    {:noreply, assign(socket, :entities, entities)}
  end

  def handle_event("delete_entity", %{"entity_id" => entity_id}, socket) do
    Spaces.delete_entity(%Entity{id: entity_id})
    entities = Spaces.get_space_top_level_entities!(socket.assigns.space.id)
    {:noreply, assign(socket, :entities, entities)}
  end

  def handle_event("select_entity", %{"id" => entity_id}, socket) do
    prev = socket.assigns.selected_entity_id
    {:noreply, assign(socket, selected_entity_id: entity_id, selected_previous_entity_id: prev)}
  end

  def handle_event("parent_selected_entities", _, socket) do
    Spaces.parent_entity(
      socket.assigns.selected_previous_entity_id,
      socket.assigns.selected_entity_id
    )

    entities = Spaces.get_space_top_level_entities!(socket.assigns.space.id)

    {:noreply,
     assign(socket, selected_entity_id: nil, selected_previous_entity_id: nil, entities: entities)}
  end
end
