defmodule ThexrWeb.ExperimentController do
  use ThexrWeb, :controller
  plug :put_root_layout, "experiment.html"

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
