defmodule ThexrWeb.ExperienceController do
  use ThexrWeb, :controller
  plug :put_root_layout, "experience.html"

  def show(conn, _params) do
    render(conn, "show.html")
  end
end
