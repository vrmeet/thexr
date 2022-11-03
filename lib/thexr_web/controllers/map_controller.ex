defmodule ThexrWeb.MapController do
  use ThexrWeb, :controller
  plug :put_root_layout, "map_maker_root.html"

  import ThexrWeb.Plugs.Identity, only: [user_token: 1]

  def index(conn, _) do
    render(conn, "index.html",
      member_id: conn.assigns.unique_id,
      user_token: user_token(conn),
      layout: false
    )
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
