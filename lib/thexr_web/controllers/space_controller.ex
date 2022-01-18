defmodule ThexrWeb.SpaceController do
  use ThexrWeb, :controller
  plug :put_root_layout, "xr_root.html"

  import ThexrWeb.Plugs.Identity, only: [user_token: 1]

  alias Thexr.Spaces

  def show(conn, %{"slug" => slug}) do
    space = Spaces.get_space_by_slug(slug)
    render(conn, "show.html", space: space, user_token: user_token(conn), layout: false)
  end
end
