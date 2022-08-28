defmodule ThexrWeb.TestController do
  use ThexrWeb, :controller
  plug :put_root_layout, "xr_test_root.html"

  import ThexrWeb.Plugs.Identity, only: [user_token: 1]
  def index(conn, _params) do
    render(conn, "index.html",
    member_id: conn.assigns.unique_id,
    user_token: user_token(conn),
    layout: false
  )


  end
end
