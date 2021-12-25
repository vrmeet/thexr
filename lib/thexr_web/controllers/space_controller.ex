defmodule ThexrWeb.SpaceController do
  use ThexrWeb, :controller
  plug :put_root_layout, "xr_root.html"

  plug :put_layout,
       alias(Thexr.Spaces)

  def show(conn, %{"slug" => slug}) do
    space = Spaces.get_space_by_slug(slug)
    render(conn, "show.html", space: space, layout: false)
  end
end
