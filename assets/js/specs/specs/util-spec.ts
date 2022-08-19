import * as utils from "../../utils/misc";
import { it, assert } from "../helper/runner";

it("makes random number", () => {
  assert(utils.random_id(5), "234");
});
