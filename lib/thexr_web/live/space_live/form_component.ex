defmodule ThexrWeb.SpaceLive.FormComponent do
  use ThexrWeb, :live_component

  alias Thexr.Spaces

  @impl true
  def update(%{space: space} = assigns, socket) do
    changeset =
      case socket.assigns[:changeset] do
        nil -> Spaces.change_space(space)
        changeset -> changeset
      end

    {:ok,
     socket
     |> assign(assigns)
     |> assign(:changeset, changeset)}
  end

  @impl true
  def handle_event("validate", %{"space" => space_params}, socket) do
    # TODO validate as new or edit based on live_action
    changeset =
      socket.assigns.space
      |> Spaces.change_space(space_params)
      |> Map.put(:action, :validate)

    {:noreply, assign(socket, :changeset, changeset)}
  end

  def handle_event("save", %{"space" => space_params}, socket) do
    space_params =
      case socket.assigns.selected_template_id do
        nil ->
          space_params

        template_id ->
          template = Spaces.get_template!(template_id)
          Map.put(space_params, "data", template.data)
      end
      |> IO.inspect(label: "space_params")

    save_space(socket, socket.assigns.action, space_params)
  end

  defp save_space(socket, :edit, space_params) do
    case Spaces.update_space(socket.assigns.space, space_params) do
      {:ok, _space} ->
        {:noreply,
         socket
         |> put_flash(:info, "Space updated successfully")
         |> push_redirect(to: socket.assigns.return_to)}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign(socket, :changeset, changeset)}
    end
  end

  defp save_space(socket, :new, space_params) do
    case Spaces.create_space(space_params) do
      {:ok, _space} ->
        {:noreply,
         socket
         |> put_flash(:info, "Space created successfully")
         |> push_redirect(to: socket.assigns.return_to)}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign(socket, changeset: changeset)}
    end
  end
end
