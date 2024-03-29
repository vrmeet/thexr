defmodule ThexrWeb.SpaceLiveTest do
  use ThexrWeb.ConnCase

  # import Phoenix.LiveViewTest
  import Thexr.SpacesFixtures

  # @create_attrs %{description: "some description", name: "some name"}
  # @update_attrs %{
  #   description: "some updated description",
  #   name: "some updated name"
  # }
  # @invalid_attrs %{description: nil, name: nil}

  defp create_space(_) do
    space = space_fixture()
    %{space: space}
  end

  describe "Index" do
    setup [:create_space]

    # test "lists all spaces", %{conn: conn, space: space} do
    #   {:ok, _index_live, html} = live(conn, Routes.space_index_path(conn, :index))

    #   assert html =~ "Listing Spaces"
    #   assert html =~ space.description
    # end

    # test "saves new space", %{conn: conn} do
    #   {:ok, index_live, _html} = live(conn, Routes.space_index_path(conn, :index))

    #   assert index_live |> element("a", "New Space") |> render_click() =~
    #            "New Space"

    #   assert_patch(index_live, Routes.space_index_path(conn, :new))

    #   assert index_live
    #          |> form("#space-form", space: @invalid_attrs)
    #          |> render_change() =~ "can&#39;t be blank"

    #   {:ok, _, html} =
    #     index_live
    #     |> form("#space-form", space: @create_attrs)
    #     |> render_submit()
    #     |> follow_redirect(conn, Routes.space_index_path(conn, :index))

    #   assert html =~ "Space created successfully"
    #   assert html =~ "some description"
    # end

    # test "updates space in listing", %{conn: conn, space: space} do
    #   {:ok, index_live, _html} = live(conn, Routes.space_index_path(conn, :index))

    #   assert index_live |> element("#space-#{space.id} a", "Edit") |> render_click() =~
    #            "Edit Space"

    #   assert_patch(index_live, Routes.space_index_path(conn, :edit, space))

    #   assert index_live
    #          |> form("#space-form", space: @invalid_attrs)
    #          |> render_change() =~ "can&#39;t be blank"

    #   {:ok, _, html} =
    #     index_live
    #     |> form("#space-form", space: @update_attrs)
    #     |> render_submit()
    #     |> follow_redirect(conn, Routes.space_index_path(conn, :index))

    #   assert html =~ "Space updated successfully"
    #   assert html =~ "some updated description"
    # end

    # test "deletes space in listing", %{conn: conn, space: space} do
    #   {:ok, index_live, _html} = live(conn, Routes.space_index_path(conn, :index))

    #   assert index_live |> element("#space-#{space.id} a", "Delete") |> render_click()
    #   refute has_element?(index_live, "#space-#{space.id}")
    # end
  end
end
