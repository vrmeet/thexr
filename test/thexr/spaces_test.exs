defmodule Thexr.SpacesTest do
  use Thexr.DataCase

  alias Thexr.Spaces

  describe "spaces" do
    alias Thexr.Spaces.{Space, State}

    test "persists space state" do
      state = %{
        "F5kFjp" => %{
          "attendance" => %{"mic_muted" => true, "nickname" => "chrome1"},
          "avatar" => %{
            "head" => %{
              "pos" => [-0.15529, 1.5, -1.2942],
              "rot" => [-0.00142, 0.98868, 0.00939, 0.14973]
            },
            "left" => nil,
            "right" => nil
          }
        },
        "door" => %{
          "acts_like_lift" => %{"height" => 2, "speed" => 0.01, "state" => "down"},
          "material" => %{"color_string" => "#FF0000", "name" => "color"},
          "shape" => %{"prim" => "box", "prim_params" => %{"height" => 0.1}},
          "transform" => %{"position" => [0, 1, 0]}
        },
        "grab_anywhere" => %{
          "grabbable" => %{"pickup" => "any", "throwable" => true},
          "material" => %{"color_string" => "#FF0000", "name" => "color"},
          "shape" => %{"prim" => "box", "prim_params" => %{"size" => 0.3}},
          "transform" => %{"position" => [0.5, 1.5, -5]}
        },
        "grab_snap" => %{
          "grabbable" => %{"pickup" => "fixed", "throwable" => true},
          "material" => %{"color_string" => "#00FF00", "name" => "color"},
          "shape" => %{"prim" => "box", "prim_params" => %{"size" => 0.25}},
          "transform" => %{"position" => [-0.5, 0.5, -5]}
        },
        "grid-floor" => %{
          "floor" => %{},
          "material" => %{"name" => "grid"},
          "shape" => %{"prim" => "plane", "prim_params" => %{"size" => 25}},
          "transform" => %{"rotation" => [1.5708, 0, 0]}
        },
        "gun" => %{
          "grabbable" => %{"pickup" => "fixed"},
          "material" => %{"color_string" => "#0000FF", "name" => "color"},
          "shape" => %{"prim" => "box", "prim_params" => %{"size" => 0.1}},
          "shootable" => %{},
          "transform" => %{"position" => [1.1, 1, 2.2]}
        },
        "my-light" => %{"lighting" => %{}}
      }

      state_id = "test-state"
      Spaces.persist_state(state_id, state)
      Spaces.get_state(state_id) |> IO.inspect()
    end
  end
end
