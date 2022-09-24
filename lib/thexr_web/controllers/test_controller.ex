defmodule ThexrWeb.TestController do
  use ThexrWeb, :controller
  plug :put_root_layout, "xr_test_root.html"

  import ThexrWeb.Plugs.Identity, only: [user_token: 1]
  def index(conn, _params) do
    space_id = "test-space"
    Thexr.SpaceSupervisor.start_space(space_id)
    render(conn, "index.html",
    member_id: conn.assigns.unique_id,
    user_token: user_token(conn),
    space_id: space_id,
    webrtc_channel_id: 23423432,
    layout: false
  )


  end
end
