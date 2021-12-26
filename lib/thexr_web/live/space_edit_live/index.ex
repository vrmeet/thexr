defmodule ThexrWeb.SpaceEditLive.Index do
  use ThexrWeb, :live_view

  alias Thexr.Spaces
  alias Thexr.Spaces.Space

  @impl true
  def mount(%{"slug" => slug}, _session, socket) do
    space = Spaces.get_space_by_slug(slug)
    entities = Spaces.get_all_entities_for_space(space.id)

    {:ok,
     assign(socket,
       space: space,
       entities: entities,
       page_title: "Edit #{space.name}"
     )}
  end

  # @impl true
  # def handle_params(params, _url, socket) do
  #   {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  # end

  @impl true
  def handle_event("add_entity", %{"entity_kind" => entity_kind}, socket) do
    attrs = %{"space_id" => socket.assigns.space.id, "type" => entity_kind}
    Spaces.create_entity(attrs)
    entities = Spaces.get_all_entities_for_space(socket.assigns.space.id)

    {:noreply, assign(socket, entities: entities)}
  end
end
