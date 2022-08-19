defmodule ThexrWeb.TestController do
  use ThexrWeb, :controller


  def index(conn, _params) do
    render(conn, "index.html")
  end
end
