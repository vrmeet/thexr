defmodule ThexrWeb.SpaceLive.FormComponent do
  use ThexrWeb, :live_component

  alias Thexr.Spaces

  @impl true
  def update(%{space: space} = assigns, socket) do
    IO.inspect(assigns, label: "in update")

    changeset =
      case socket.assigns[:changeset] do
        nil -> Spaces.change_space(space) |> IO.inspect(label: "when nil")
        changeset -> changeset |> IO.inspect(label: "when not nil")
      end

    IO.inspect(changeset, label: "changeset")

    {:ok,
     socket
     |> assign(assigns)
     |> assign(:changeset, changeset)}
  end

  @impl true
  def handle_event("validate", %{"space" => space_params}, socket) do
    IO.inspect("in validate")
    # TODO validate as new or edit based on live_action
    changeset =
      socket.assigns.space
      |> Spaces.change_space(space_params)
      |> Map.put(:action, :validate)

    IO.inspect(changeset, label: "changeset")
    {:noreply, assign(socket, :changeset, changeset)}
  end

  def handle_event("save", %{"space" => space_params}, socket) do
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
