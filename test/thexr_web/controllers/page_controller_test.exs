defmodule ThexrWeb.PageControllerTest do
  use ThexrWeb.ConnCase

  test "GET /", %{conn: conn} do
    conn = get(conn, "/")
    assert html_response(conn, 200) =~ "thexr.space"
  end
end
