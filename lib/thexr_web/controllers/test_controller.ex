defmodule ThexrWeb.TestController do
  use ThexrWeb, :controller
  plug :put_root_layout, "xr_test_root.html"

  import ThexrWeb.Plugs.Identity, only: [user_token: 1]

  # blank has no systems
  # kills and recreates a new genserver every time

  def blank(conn, _params) do
    space_id = "test-blank"
    Thexr.SpaceSupervisor.stop_space(space_id)
    Thexr.SpaceSupervisor.start_space(space_id)
    render(conn, "index.html",
    member_id: conn.assigns.unique_id,
    user_token: user_token(conn),
    space_id: space_id,
    systems: nil,
    webrtc_channel_id: 1,
    layout: false
  )
  end

  # default, will load commonly used systems
  # will nudge/reuse existing genserver

  def default(conn, _params) do
    space_id = "test-default"
    Thexr.SpaceSupervisor.start_space(space_id)
    render(conn, "index.html",
    member_id: conn.assigns.unique_id,
    user_token: user_token(conn),
    space_id: space_id,
    systems: "/systems/system-lighting.js,/systems/system-shape.js,/systems/system-transform.js",
    webrtc_channel_id: 2,
    layout: false
  )
  end
end
