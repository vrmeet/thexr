import { Entity } from "../../../core/entities/entity";
import { describe, beforeEach, test } from "../../helper/runner";
import { systems } from "../../../core/systems/systems";
import * as BABYLON from "babylonjs";
import { expect } from "chai";

describe("lift system", () => {
  let engine: BABYLON.Engine = new BABYLON.NullEngine();
  let scene: BABYLON.Scene;

  beforeEach(() => {
    if (scene) {
      scene.dispose();
    }
    scene = new BABYLON.Scene(engine);
    systems.initAll("me", scene);
  });

  test("door goes up when clicked", () => {
    let entity = new Entity("door1", { acts_like_lift: {} }, scene);
    expect(systems.lift.lifts["door1"].state).to.eql("down");
    // scene.simulatePointerDown(...)
  });
});
