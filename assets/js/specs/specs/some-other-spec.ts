import { mode } from "../../mode";
import { assert, it } from "../helper/runner";

it("has a mode", () => {
  assert(mode.editing, false);
});
