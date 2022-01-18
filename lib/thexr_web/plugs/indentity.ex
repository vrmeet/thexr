defmodule ThexrWeb.Plugs.Identity do
  import Plug.Conn

  @doc """
  Adds a random id into the session so we get to uniquely identify this
  user even if they are not logged in
  """
  def maybe_assign_unique_id(conn, _opts) do
    maybe_unique_id = get_session(conn, :unique_id)

    if maybe_unique_id == nil do
      unique_id = Thexr.Utils.random_id(5)
      conn = put_session(conn, :unique_id, unique_id)
      assign(conn, :unique_id, unique_id)
    else
      assign(conn, :unique_id, maybe_unique_id)
    end
  end

  def user_token(conn) do
    Phoenix.Token.sign(
      ThexrWeb.Endpoint,
      "salt",
      member_id(conn)
    )
  end

  def member_id(conn) do
    conn.assigns.unique_id
  end
end
