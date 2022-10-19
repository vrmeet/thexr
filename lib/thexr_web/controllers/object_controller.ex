defmodule ThexrWeb.ObjectController do
  use ThexrWeb, :controller

  def index(conn, _params) do
    objects = Thexr.Spaces.list_asset_meshes()
    render(conn, "index.html", objects: objects)
  end
end
