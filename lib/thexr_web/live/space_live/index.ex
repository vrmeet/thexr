defmodule ThexrWeb.SpaceLive.Index do
  use ThexrWeb, :live_view

  alias Thexr.Spaces
  alias Thexr.Spaces.Space

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, spaces: list_spaces(), selected_template_id: nil)}
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :edit, %{"id" => id}) do
    socket
    |> assign(:page_title, "Edit Space")
    |> assign(:space, Spaces.get_space!(id))
  end

  defp apply_action(socket, :new, _params) do
    socket
    |> assign(:page_title, "New Space")
    |> assign(:space, %Space{})
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Listing Spaces")
    |> assign(:space, nil)
  end

  @impl true
  def handle_event("delete", %{"id" => id}, socket) do
    space = Spaces.get_space!(id)
    {:ok, _} = Spaces.delete_space(space)

    {:noreply, assign(socket, :spaces, list_spaces())}
  end

  @impl true
  def handle_info({:template_clicked, template_id}, socket) do
    socket = assign(socket, selected_template_id: template_id)

    {:noreply, socket}
  end

  defp list_spaces do
    Spaces.list_spaces()
  end
end
