defmodule ThexrWeb.SpaceEditLive.Index do
  use ThexrWeb, :live_view
  import Ecto.Query
  import Ecto.Changeset, only: [apply_action: 2]

  alias Thexr.Spaces
  alias Thexr.Spaces.{Component, Entity}
  alias Thexr.Repo

  @impl true
  def mount(%{"slug" => slug}, _session, socket) do
    space = Spaces.get_space_by_slug(slug)
    entities = Spaces.get_all_entities_for_space(space.id)

    {:ok,
     assign(socket,
       space: space,
       entities: entities,
       selected_entity: nil,
       component_changeset: nil,
       page_title: "Edit #{space.name}",
       header: false,
       ref: nil
     )}
  end

  # @impl true
  # def handle_params(params, _url, socket) do
  #   {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  # end

  @impl true

  def handle_event("delete_entity", %{"id" => id}, socket) do
    Spaces.delete_entity(id: id)
    new_entities = Enum.filter(socket.assigns.entities, fn entity -> entity.id != id end)
    socket = assign(socket, entities: new_entities)

    socket =
      cond do
        socket.assigns.selected_entity && socket.assigns.selected_entity.id == id ->
          assign(socket, selected_entity: nil)

        true ->
          socket
      end

    socket =
      cond do
        socket.assigns.component_changeset &&
            socket.assigns.component_changeset.data.entity_id == id ->
          assign(socket, component_changeset: nil)

        true ->
          socket
      end

    ThexrWeb.Endpoint.broadcast(
      "space:#{socket.assigns.space.slug}",
      "entity_deleted",
      %{id: id}
    )

    {:noreply, socket}
  end

  def handle_event("add_entity", %{"entity_kind" => entity_kind}, socket) do
    socket = trigger_autosave(socket)
    {:ok, entity} = Spaces.add_entity_with_broadcast(socket.assigns.space, entity_kind)

    entities = socket.assigns.entities ++ [entity]

    {:noreply,
     assign(socket, entities: entities, selected_entity: entity, component_changeset: nil)}
  end

  def handle_event("select_entity", %{"id" => id}, socket) do
    selected_entity = socket.assigns.selected_entity

    cond do
      selected_entity == nil || id != selected_entity.id ->
        socket = trigger_autosave(socket)
        results = Enum.filter(socket.assigns.entities, fn entity -> entity.id == id end)

        selected_entity =
          List.first(results) |> Repo.preload(components: from(c in Component, order_by: c.type))

        {:noreply,
         assign(socket,
           selected_entity: selected_entity,
           component_changeset: nil
         )}

      true ->
        {:noreply, socket}
    end
  end

  def handle_event("select_component", %{"id" => id}, socket) do
    component_changeset = socket.assigns.component_changeset

    cond do
      component_changeset == nil || component_changeset.data.id != id ->
        socket = trigger_autosave(socket)

        results =
          Enum.filter(socket.assigns.selected_entity.components, fn component ->
            component.id == id
          end)

        selected_component = List.first(results)
        component_changeset = Component.changeset(selected_component, %{})

        {:noreply,
         assign(socket,
           component_changeset: component_changeset
         )}

      true ->
        {:noreply, socket}
    end
  end

  def handle_event("component_change", %{"component" => component}, socket) do
    socket = debounce_autosave(socket)
    component_changeset = Component.changeset(socket.assigns.component_changeset, component)

    result =
      component_changeset
      |> apply_action(:update)

    case result do
      {:ok, _component} ->
        {:noreply, assign(socket, component_changeset: %{component_changeset | action: :update})}

      {:error, changeset} ->
        {:noreply, assign(socket, component_changeset: changeset)}
    end
  end

  @impl true
  def handle_info(:autosave, socket) do
    socket = trigger_autosave(socket)
    {:noreply, socket}
  end

  @impl true
  def terminate(reason, socket) do
    IO.inspect("getting terminated!")
    IO.inspect(reason)
    # try to save any unsaved changes if window is closed before autosave happens
    trigger_autosave(socket)

    :ok
  end

  def debounce_autosave(socket) do
    IO.inspect("debouncing ")
    IO.inspect(:os.timestamp())
    # cancel previous timer if any
    ref = socket.assigns.ref

    if ref != nil do
      Process.cancel_timer(ref)
    end

    ref = Process.send_after(self(), :autosave, 800)
    assign(socket, ref: ref)
  end

  def trigger_autosave(socket) do
    IO.inspect("attempting auto save")
    IO.inspect(socket.assigns.component_changeset, label: "changeset at top")
    ref = socket.assigns.ref

    if ref != nil do
      Process.cancel_timer(ref)
    end

    with true <- socket.assigns.component_changeset != nil,
         true <- socket.assigns.component_changeset.action == :update,
         {:ok, component} <- Repo.update(socket.assigns.component_changeset) do
      # this should prevent needless save to DB if no action is set
      updated_changeset = Component.changeset(component, %{})
      socket = assign(socket, component_changeset: updated_changeset)

      ThexrWeb.Endpoint.broadcast("space:#{socket.assigns.space.slug}", "component_changed", %{
        "entity_id" => component.entity_id,
        "type" => component.type,
        "data" => component.data
      })

      selected_entity = socket.assigns.selected_entity
      IO.inspect("success")

      updated_components =
        Enum.map(selected_entity.components, fn comp ->
          if comp.id == component.id do
            component
          else
            comp
          end
        end)

      assign(socket,
        ref: nil,
        selected_entity: %Entity{selected_entity | components: updated_components}
      )
    else
      err ->
        IO.inspect(socket.assigns.component_changeset, label: "component_changeset")
        IO.inspect("didn't auto save")
        IO.inspect(err, label: "err")
        assign(socket, ref: nil)
    end
  end

  def component_inputs(component_changeset, form) do
    data = Map.from_struct(component_changeset.data.data)

    content_tag(:div) do
      Enum.map(data, fn {k, _v} ->
        [
          content_tag(:label, k),
          text_input(form, k),
          content_tag(:div, error_tag(form, k), class: "error")
        ]
      end)
    end
  end
end
