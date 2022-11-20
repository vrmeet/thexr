defmodule ThexrWeb.SpaceController do
  use ThexrWeb, :controller
  plug :put_root_layout, "xr_root.html"

  import ThexrWeb.Plugs.Identity, only: [user_token: 1]

  alias Thexr.Spaces

  @spec show(Plug.Conn.t(), map) :: Plug.Conn.t()
  def show(conn, %{"space_id" => space_id}) do
    case Spaces.find_and_nudge_space(space_id) do
      nil ->
        conn
        |> put_flash(:error, "Unrecognized Space ID in the URL")
        |> redirect(to: Routes.page_path(conn, :index))

      {:ok, space, _pid} ->
        render(conn, "show.html",
          context_opts: %{
            member_id: conn.assigns.unique_id,
            user_token: user_token(conn),
            space: space,
            webrtc_channel_id: space.id
          },
          layout: false
        )
    end
  end

  # def delete_nav_mesh(conn, %{"space_id" => space_id}) do
  #   Spaces.delete_nav_mesh(space_id)
  #   conn |> json(%{})
  # end

  # def save_nav_mesh(conn, %{"space_id" => space_id}) do
  #   {:ok, body, conn} = Plug.Conn.read_body(conn)

  #   Spaces.set_nav_mesh(space_id, body)
  #   conn |> json(%{})
  # end

  # def get_nav_mesh(conn, %{"space_id" => space_id}) do
  #   case Spaces.get_nav_mesh(space_id) do
  #     # 204
  #     nil -> send_resp(conn, :no_content, "")
  #     # 200
  #     data -> send_resp(conn, :ok, data)
  #   end
  # end
end
