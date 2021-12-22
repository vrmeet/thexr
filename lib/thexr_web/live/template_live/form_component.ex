defmodule ThexrWeb.TemplateLive.FormComponent do
  use ThexrWeb, :live_component

  alias Thexr.Spaces

  @impl true
  def update(%{template: template} = assigns, socket) do
    changeset = Spaces.change_template(template)

    {:ok,
     socket
     |> assign(assigns)
     |> assign(:changeset, changeset)}
  end

  @impl true
  def handle_event("validate", %{"template" => template_params}, socket) do
    changeset =
      socket.assigns.template
      |> Spaces.change_template(template_params)
      |> Map.put(:action, :validate)

    {:noreply, assign(socket, :changeset, changeset)}
  end

  def handle_event("save", %{"template" => template_params}, socket) do
    save_template(socket, socket.assigns.action, template_params)
  end

  defp save_template(socket, :edit, template_params) do
    case Spaces.update_template(socket.assigns.template, template_params) do
      {:ok, _template} ->
        {:noreply,
         socket
         |> put_flash(:info, "Template updated successfully")
         |> push_redirect(to: socket.assigns.return_to)}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign(socket, :changeset, changeset)}
    end
  end

  defp save_template(socket, :new, template_params) do
    case Spaces.create_template(template_params) do
      {:ok, _template} ->
        {:noreply,
         socket
         |> put_flash(:info, "Template created successfully")
         |> push_redirect(to: socket.assigns.return_to)}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign(socket, changeset: changeset)}
    end
  end
end
