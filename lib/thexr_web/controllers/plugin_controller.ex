defmodule ThexrWeb.PluginController do
  use ThexrWeb, :controller

  plug :put_layout, "plugin.html"

  alias Thexr.Spaces
  alias Thexr.Spaces.Plugin

  def index(conn, _params) do
    plugins = Spaces.list_plugins()
    render(conn, "index.html", plugins: plugins)
  end

  def new(conn, _params) do
    changeset = Spaces.change_plugin(%Plugin{})
    render(conn, "new.html", changeset: changeset)
  end

  def create(conn, %{"plugin" => plugin_params}) do
    case Spaces.create_plugin(plugin_params) do
      {:ok, plugin} ->
        conn
        |> put_flash(:info, "Plugin created successfully.")
        |> redirect(to: Routes.plugin_path(conn, :show, plugin))

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, "new.html", changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    plugin = Spaces.get_plugin!(id)
    render(conn, "show.html", plugin: plugin)
  end

  def edit(conn, %{"id" => id}) do
    plugin = Spaces.get_plugin!(id)
    changeset = Spaces.change_plugin(plugin)
    render(conn, "edit.html", plugin: plugin, changeset: changeset)
  end

  def update(conn, %{"id" => id, "plugin" => plugin_params}) do
    plugin = Spaces.get_plugin!(id)

    case Spaces.update_plugin(plugin, plugin_params) do
      {:ok, plugin} ->
        conn
        |> put_flash(:info, "Plugin updated successfully.")
        |> redirect(to: Routes.plugin_path(conn, :show, plugin))

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, "edit.html", plugin: plugin, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    plugin = Spaces.get_plugin!(id)
    {:ok, _plugin} = Spaces.delete_plugin(plugin)

    conn
    |> put_flash(:info, "Plugin deleted successfully.")
    |> redirect(to: Routes.plugin_path(conn, :index))
  end
end
