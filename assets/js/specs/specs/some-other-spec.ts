import { mode } from "../../mode";
import { describe, test, assert } from "../helper/runner";

describe("mode", () => {
  test("has a mode", () => {
    assert(mode.editing, false);
  });
});
