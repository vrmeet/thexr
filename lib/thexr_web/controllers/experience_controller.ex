defmodule ThexrWeb.SpaceController do
  use ThexrWeb, :controller
  plug :put_root_layout, "xr_root.html"

  def show(conn, _params) do
    render(conn, "show.html")
  end
end
