defmodule ThexrWeb.SpaceLive.Show do
  use ThexrWeb, :live_view

  alias Thexr.Spaces
  alias Thexr.Spaces.Entity

  @impl true
  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_params(%{"slug" => slug}, _, socket) do
    space = Spaces.get_space_by_slug(slug)

    {:noreply,
     socket
     |> assign(:page_title, page_title(socket.assigns.live_action))
     |> assign(:space, space)
     |> assign(:selected_entity, nil)
     |> assign(:selected_previous_entity, nil)
     |> assign(:expanded_nodes, [])
     |> assign(:entities, Spaces.entity_tree_nested(space.id, []))}
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
    Spaces.add_entity_with_broadcast(socket.assigns.space, entity_kind)
    {:noreply, reload_tree(socket)}
  end

  def handle_event("delete_selected_entity", _, socket) do
    selected_entity_id = socket.assigns.selected_entity.id
    Spaces.delete_entity(id: selected_entity_id)

    socket =
      socket
      |> assign(:selected_entity, nil)
      |> remove_from_expanded_nodes(selected_entity_id)

    {:noreply, reload_tree(socket)}
  end

  def handle_event("select_entity", %{"id" => entity_id}, socket) do
    prev_entity = socket.assigns.selected_entity

    if prev_entity && prev_entity.id == entity_id do
      # no-op, already selected
      {:noreply, socket}
    else
      {:noreply,
       assign(socket,
         selected_entity: Spaces.get_entity!(entity_id),
         selected_previous_entity: prev_entity,
         selected_entity_components: Spaces.list_components_for_entity(entity_id)
       )}
    end
  end

  def handle_event("unparent_selected_entity", _, socket) do
    Spaces.unparent_entity(socket.assigns.selected_entity.id)
    socket = reload_tree(socket)
    {:noreply, socket}
  end

  def handle_event("parent_selected_entities", _, socket) do
    Spaces.parent_entity(
      socket.assigns.selected_previous_entity.id,
      socket.assigns.selected_entity.id
    )

    socket = reload_tree(socket)

    {:noreply, assign(socket, selected_entity: nil, selected_previous_entity: nil)}
  end

  def handle_event("expand_entity", %{"id" => entity_id}, socket) do
    socket =
      socket
      |> add_to_expanded_nodes(entity_id)
      |> reload_tree()

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
