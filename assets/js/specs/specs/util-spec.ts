import * as utils from "../../utils/misc";
import { assert, beforeEach, describe, test } from "../helper/runner";

describe("util", () => {
  test("makes rand", () => {
    assert(utils.random_id(5), "23423");
  });
});

describe("addition", () => {
  console.log("2nd block");
  beforeEach(() => {
    console.log("do this in each test");
  });
  test("1 + 1", () => {
    assert(1 + 1, 2);
  });
  test("1 + 3", () => {
    assert(1 + 3, 5);
  });
});
