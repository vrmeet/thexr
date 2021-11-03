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
     |> assign(:expanded_nodes, [])
     |> assign(:entities, Spaces.entity_tree_nested(id, []))}
  end

  defp page_title(:show), do: "Show Space"
  defp page_title(:edit), do: "Edit Space"

  def reload_tree(socket) do
    entities = Spaces.entity_tree_nested(socket.assigns.space.id, socket.assigns.expanded_nodes)
    assign(socket, :entities, entities)
  end

  def add_to_expanded_nodes(socket, node_id) do
    expanded_nodes = socket.assigns.expanded_nodes
    assign(socket, :expanded_nodes, Enum.uniq([node_id | expanded_nodes]))
  end

  def remove_from_expanded_nodes(socket, node_id) do
    expanded_nodes = socket.assigns.expanded_nodes
    assign(socket, :expanded_nodes, List.delete(expanded_nodes, node_id))
  end

  @impl true
  def handle_event("add_entity", %{"entity_kind" => entity_kind}, socket) do
    attrs = %{space_id: socket.assigns.space.id, type: entity_kind}
    Spaces.create_entity(attrs)
    {:noreply, reload_tree(socket)}
  end

  def handle_event("delete_selected_entity", _, socket) do
    selected_entity_id = socket.assigns.selected_entity_id
    Spaces.delete_entity(%Entity{id: selected_entity_id})

    socket =
      socket
      |> assign(:selected_entity_id, nil)
      |> remove_from_expanded_nodes(selected_entity_id)

    {:noreply, reload_tree(socket)}
  end

  def handle_event("select_entity", %{"id" => entity_id}, socket) do
    prev = socket.assigns.selected_entity_id

    if prev == entity_id do
      # no-op, already selected
      {:noreply, socket}
    else
      {:noreply, assign(socket, selected_entity_id: entity_id, selected_previous_entity_id: prev)}
    end
  end

  def handle_event("parent_selected_entities", _, socket) do
    Spaces.parent_entity(
      socket.assigns.selected_previous_entity_id,
      socket.assigns.selected_entity_id
    )

    socket = reload_tree(socket)

    {:noreply, assign(socket, selected_entity_id: nil, selected_previous_entity_id: nil)}
  end

  def handle_event("expand_entity", %{"id" => entity_id}, socket) do
    IO.inspect("calling expand node #{entity_id}")

    socket =
      socket
      |> add_to_expanded_nodes(entity_id)
      |> reload_tree()

    IO.inspect(socket.assigns)
    {:noreply, socket}
  end

  def handle_event("collapse_entity", %{"id" => entity_id}, socket) do
    socket =
      socket
      |> remove_from_expanded_nodes(entity_id)
      |> reload_tree()

    {:noreply, socket}
  end
end
