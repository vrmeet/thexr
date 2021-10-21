defmodule ThexrWeb.LiveHelpers do
  import Phoenix.LiveView.Helpers

  @doc """
  Renders a component inside the `ThexrWeb.ModalComponent` component.

  The rendered modal receives a `:return_to` option to properly update
  the URL when the modal is closed.

  ## Examples

      <%= live_modal ThexrWeb.SpaceLive.FormComponent,
        id: @space.id || :new,
        action: @live_action,
        space: @space,
        return_to: Routes.space_index_path(@socket, :index) %>
  """
  def live_modal(component, opts) do
    path = Keyword.fetch!(opts, :return_to)
    modal_opts = [id: :modal, return_to: path, component: component, opts: opts]
    live_component(ThexrWeb.ModalComponent, modal_opts)
  end
end
