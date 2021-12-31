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
       ref: nil
     )}
  end

  # @impl true
  # def handle_params(params, _url, socket) do
  #   {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  # end

  @impl true
  def handle_event("add_entity", %{"entity_kind" => entity_kind}, socket) do
    socket = trigger_autosave(socket)
    attrs = %{"space_id" => socket.assigns.space.id, "type" => entity_kind}
    {:ok, entity} = Spaces.create_entity(attrs)
    entities = Spaces.get_all_entities_for_space(socket.assigns.space.id)
    entity = entity |> Repo.preload(components: from(c in Component, order_by: c.type))

    {:noreply,
     assign(socket, entities: entities, selected_entity: entity, component_changeset: nil)}
  end

  def handle_event("select_entity", %{"id" => id}, socket) do
    socket = trigger_autosave(socket)

    selected_entity = socket.assigns.selected_entity

    cond do
      selected_entity == nil || id != selected_entity.id ->
        IO.inspect("selected entity")
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
    IO.inspect("select component")

    socket = trigger_autosave(socket)

    component_changeset = socket.assigns.component_changeset

    cond do
      component_changeset == nil || component_changeset.data.id != id ->
        IO.inspect("select component")

        results =
          Enum.filter(socket.assigns.selected_entity.components, fn component ->
            component.id == id
          end)

        selected_component = List.first(results)
        component_changeset = Component.changeset(selected_component)

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
        {:noreply, assign(socket, component_changeset: component_changeset)}

      {:error, changeset} ->
        {:noreply, assign(socket, component_changeset: changeset)}
    end
  end

  # def handle_event("component_save", _, socket) do
  #   case Repo.update(socket.assigns.component_changeset) do
  #     {:ok, component} ->
  #       IO.inspect("saved")
  #       component_changeset = Component.changeset(component)
  #       {:noreply, assign(socket, component_changeset: component_changeset)}

  #     {:error, changeset} ->
  #       IO.inspect("errored")
  #       {:noreply, assign(socket, component_changeset: changeset)}
  #   end
  # end

  @impl true
  def handle_info(:autosave, socket) do
    socket = trigger_autosave(socket)
    {:noreply, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    # try to save any unsaved changes if window is closed before autosave happens
    trigger_autosave(socket)

    :ok
  end

  def debounce_autosave(socket) do
    IO.inspect("debouncing ")
    # cancel previous timer if any
    ref = socket.assigns.ref

    if ref != nil do
      Process.cancel_timer(ref)
    end

    # set a new timer

    ref = Process.send_after(self(), :autosave, 2000)

    assign(socket, ref: ref)
  end

  def trigger_autosave(socket) do
    IO.inspect("attempting auto save")
    ref = socket.assigns.ref

    if ref != nil do
      Process.cancel_timer(ref)
    end

    with true <- socket.assigns.component_changeset != nil,
         {:ok, component} <- Repo.update(socket.assigns.component_changeset) do
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
        IO.inspect(err)
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
