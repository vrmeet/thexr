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

  def save_nav_mesh(conn, %{"space_id" => space_id}) do
    {:ok, body, conn} = Plug.Conn.read_body(conn)

    IO.inspect(body, label: "body that i got in controller")
    Spaces.set_nav_mesh(space_id, body)
    conn |> json(%{})
  end

  def get_nav_mesh(conn, %{"space_id" => space_id}) do
    case Spaces.get_nav_mesh(space_id) do
      nil -> send_resp(conn, :no_content, "")
      data -> send_resp(conn, :ok, data)
    end
  end

  def nudge_space(space) do
    Thexr.SpaceSupervisor.start_space(space)
  end
end
