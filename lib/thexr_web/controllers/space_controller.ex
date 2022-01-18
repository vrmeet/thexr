defmodule ThexrWeb.SpaceController do
  use ThexrWeb, :controller
  plug :put_root_layout, "xr_root.html"

  import ThexrWeb.Plugs.Identity, only: [user_token: 1]

  alias Thexr.Spaces

  def show(conn, %{"slug" => slug}) do
    space = Spaces.get_space_by_slug(slug)

    case space do
      nil ->
        conn
        |> put_flash(:error, "Unrecognized Space Slug in the URL")
        |> redirect(to: Routes.page_path(conn, :index))

      space ->
        render(conn, "show.html", space: space, user_token: user_token(conn), layout: false)
    end
  end
end
