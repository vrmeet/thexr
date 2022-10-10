defmodule ThexrWeb.TestController do
  use ThexrWeb, :controller
  plug :put_root_layout, "xr_test_root.html"

  import ThexrWeb.Plugs.Identity, only: [user_token: 1]

  # blank has no systems
  # kills and recreates a new genserver every time

  def blank(conn, _params) do
    space_id = "test-blank"
    Thexr.SpaceSupervisor.stop_space(space_id)

    Thexr.SpaceSupervisor.start_space(space_id)
    |> IO.inspect(label: "starting test/blank")

    Thexr.SpaceServer.process_event(space_id, "entity_created", %{
      "id" => "my-light",
      "components" => %{
        "lighting" => %{}
      }
    })

    Thexr.SpaceServer.process_event(space_id, "entity_created", %{
      "id" => "grid-floor",
      "components" => %{
        "shape" => %{"prim" => "plane", "prim_params" => %{"size" => 25}},
        "rotation" => [1.5708, 0, 0],
        "material" => %{"name" => "grid"}
      }
    })

    render(conn, "index.html",
      member_id: conn.assigns.unique_id,
      user_token: user_token(conn),
      space_id: space_id,
      systems: nil,
      webrtc_channel_id: 1,
      layout: false
    )
  end

  # default, will load commonly used systems
  # will nudge/reuse existing genserver

  def default(conn, _params) do
    space_id = "test-default"

    Thexr.SpaceSupervisor.start_space(space_id)
    |> IO.inspect(label: "starting test/default")

    Thexr.SpaceServer.process_event(space_id, "entity_created", %{
      "id" => "my-light",
      "components" => %{
        "lighting" => %{}
      }
    })

    Thexr.SpaceServer.process_event(space_id, "entity_created", %{
      "id" => "grid-floor",
      "components" => %{
        "shape" => %{"prim" => "plane", "prim_params" => %{"size" => 25}},
        "transform" => %{"rotation" => [1.5708, 0, 0]},
        "material" => %{"name" => "grid"},
        "floor" => %{}
      }
    })

    Thexr.SpaceServer.process_event(space_id, "entity_created", %{
      "id" => "grab_anywhere",
      "components" => %{
        "shape" => %{"prim" => "box", "prim_params" => %{"size" => 0.3}},
        "material" => %{"name" => "color", "color_string" => "#FF0000"},
        "transform" => %{"position" => [0.5, 1.5, -5]},
        "grabbable" => %{"pickup" => "any"}
      }
    })

    Thexr.SpaceServer.process_event(space_id, "entity_created", %{
      "id" => "grab_snap",
      "components" => %{
        "shape" => %{"prim" => "box", "prim_params" => %{"size" => 0.25}},
        "material" => %{"name" => "color", "color_string" => "#00FF00"},
        "transform" => %{"position" => [-0.5, 0.5, -5]},
        "grabbable" => %{"pickup" => "fixed"}
      }
    })

    Thexr.SpaceServer.process_event(space_id, "entity_created", %{
      "id" => "door",
      "components" => %{
        "shape" => %{"prim" => "box", "prim_params" => %{"height" => 0.1}},
        "material" => %{"name" => "color", "color_string" => "#FF0000"},
        "transform" => %{"position" => [0, 1, 0]},
        "acts_like_lift" => %{"height" => 2, "speed" => 0.01, "state" => "down"}
      }
    })

    render(conn, "index.html",
      member_id: conn.assigns.unique_id,
      user_token: user_token(conn),
      space_id: space_id,
      systems: ~w{/systems/system-lift.js},
      webrtc_channel_id: 2,
      layout: false
    )
  end
end
