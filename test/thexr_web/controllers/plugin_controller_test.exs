defmodule ThexrWeb.PluginControllerTest do
  use ThexrWeb.ConnCase

  import Thexr.SpacesFixtures

  @create_attrs %{js: "some js", ts: "some ts"}
  @update_attrs %{js: "some updated js", ts: "some updated ts"}
  @invalid_attrs %{js: nil, ts: nil}

  describe "index" do
    test "lists all plugins", %{conn: conn} do
      conn = get(conn, Routes.plugin_path(conn, :index))
      assert html_response(conn, 200) =~ "Listing Plugins"
    end
  end

  describe "new plugin" do
    test "renders form", %{conn: conn} do
      conn = get(conn, Routes.plugin_path(conn, :new))
      assert html_response(conn, 200) =~ "New Plugin"
    end
  end

  describe "create plugin" do
    test "redirects to show when data is valid", %{conn: conn} do
      conn = post(conn, Routes.plugin_path(conn, :create), plugin: @create_attrs)

      assert %{id: id} = redirected_params(conn)
      assert redirected_to(conn) == Routes.plugin_path(conn, :show, id)

      conn = get(conn, Routes.plugin_path(conn, :show, id))
      assert html_response(conn, 200) =~ "Show Plugin"
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, Routes.plugin_path(conn, :create), plugin: @invalid_attrs)
      assert html_response(conn, 200) =~ "New Plugin"
    end
  end

  describe "edit plugin" do
    setup [:create_plugin]

    test "renders form for editing chosen plugin", %{conn: conn, plugin: plugin} do
      conn = get(conn, Routes.plugin_path(conn, :edit, plugin))
      assert html_response(conn, 200) =~ "Edit Plugin"
    end
  end

  describe "update plugin" do
    setup [:create_plugin]

    test "redirects when data is valid", %{conn: conn, plugin: plugin} do
      conn = put(conn, Routes.plugin_path(conn, :update, plugin), plugin: @update_attrs)
      assert redirected_to(conn) == Routes.plugin_path(conn, :show, plugin)

      conn = get(conn, Routes.plugin_path(conn, :show, plugin))
      assert html_response(conn, 200) =~ "some updated js"
    end

    test "renders errors when data is invalid", %{conn: conn, plugin: plugin} do
      conn = put(conn, Routes.plugin_path(conn, :update, plugin), plugin: @invalid_attrs)
      assert html_response(conn, 200) =~ "Edit Plugin"
    end
  end

  describe "delete plugin" do
    setup [:create_plugin]

    test "deletes chosen plugin", %{conn: conn, plugin: plugin} do
      conn = delete(conn, Routes.plugin_path(conn, :delete, plugin))
      assert redirected_to(conn) == Routes.plugin_path(conn, :index)

      assert_error_sent 404, fn ->
        get(conn, Routes.plugin_path(conn, :show, plugin))
      end
    end
  end

  defp create_plugin(_) do
    plugin = plugin_fixture()
    %{plugin: plugin}
  end
end
