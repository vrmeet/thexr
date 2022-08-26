import { Entity } from "../../../core/entities/entity";
import { describe, beforeEach, test } from "../../helper/runner";
import { systems } from "../../../core/systems/systems";
import * as BABYLON from "babylonjs";
import { expect } from "chai";
import { bindSceneObservablesToSignalHub } from "../../../utils/misc";

describe("lift system", () => {
  let engine: BABYLON.Engine = new BABYLON.NullEngine();
  let scene: BABYLON.Scene;

  beforeEach(() => {
    if (scene) {
      scene.dispose();
    }
    scene = new BABYLON.Scene(engine);
    bindSceneObservablesToSignalHub(scene)
    systems.initAll("me", scene);
  });

  test("door goes up when clicked", async () => {
    let entity = new Entity("door1", { acts_like_lift: {} }, scene);
    expect(systems.lift.lifts["door1"].state).to.eql("down");

    let pickInfo = scene.pick(0, 0);
    pickInfo.hit = true;
    pickInfo.pickedMesh = entity.mesh;
    scene.simulatePointerDown(pickInfo, { pointerId: 8 });
    await new Promise((r) => setTimeout(r, 1200));
    expect(systems.lift.lifts["door1"].state).to.eql("up")
  });
});
