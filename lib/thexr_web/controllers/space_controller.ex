defmodule ThexrWeb.SpaceController do
  use ThexrWeb, :controller
  plug :put_root_layout, "xr_root.html"

  import ThexrWeb.Plugs.Identity, only: [user_token: 1]

  alias Thexr.Spaces

  def show(conn, %{"space_id" => space_id}) do
    case Spaces.get_space_by_id(space_id) do
      nil ->
        conn
        |> put_flash(:error, "Unrecognized Space ID in the URL")
        |> redirect(to: Routes.page_path(conn, :index))

      space ->
        nudge_space(space)

        render(conn, "show.html",
          member_id: conn.assigns.unique_id,
          space: space,
          user_token: user_token(conn),
          layout: false
        )
    end
  end

  def nudge_space(space) do
    Thexr.SpaceSupervisor.start_space(space)
  end
end
