defmodule ThexrWeb.SpaceLive.TemplatesComponent do
  use ThexrWeb, :live_component

  alias Thexr.Spaces
  # alias Thexr.Spaces.Template

  def mount(socket) do
    templates = Spaces.list_templates()
    {:ok, assign(socket, templates: templates, selected_template_id: nil)}
  end

  def handle_event("template_clicked", %{"id" => template_id}, socket) do
    IO.inspect("template clicked in templates component")
    socket = assign(socket, selected_template_id: template_id)
    send(self(), {:template_clicked, template_id})
    {:noreply, socket}
  end
end
