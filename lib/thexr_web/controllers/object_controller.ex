defmodule ThexrWeb.ObjectController do
  use ThexrWeb, :controller

  def index(conn, _params) do
    objects = Thexr.Spaces.list_asset_meshes()
    render(conn, "index.html", objects: objects)
  end

  def show(conn, %{"id" => id}) do
    asset = Thexr.Spaces.get_asset_mesh(id)
    conn |> json(asset.data)
  end

  def state_mesh(conn, %{"state_id" => state_id, "mesh_id" => mesh_id}) do
    asset = Thexr.Spaces.get_state_mesh(state_id, mesh_id)
    conn |> json(asset.data)
  end
end
