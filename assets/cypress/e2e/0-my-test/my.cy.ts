/// <reference types="cypress" />

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress
import { Entity } from "../../../js/ecs/entities/entity";
import { systems } from "../../../js/ecs/systems/systems";
import * as BABYLON from "babylonjs";
import { expect } from "chai";
import { bindSceneObservablesToSignalHub } from "../../../js/utils/misc";

describe("lift system", () => {
  let engine: BABYLON.Engine = new BABYLON.NullEngine();
  let scene: BABYLON.Scene;

  beforeEach(() => {
    scene = new BABYLON.Scene(engine);
    const freeCamera = new BABYLON.FreeCamera(
      "freeCam",
      BABYLON.Vector3.FromArray([1, 2, 3]),
      scene
    );
    bindSceneObservablesToSignalHub(scene);
    systems.initAll("me", scene);

    engine.runRenderLoop(() => {
      scene.render();
    });
  });

  it("door goes up when clicked", async () => {
    let entity = new Entity("door1", { acts_like_lift: {} }, scene);
    expect(systems.lift.lifts["door1"].state).to.eql("down");

    let pickInfo = scene.pick(0, 0) as BABYLON.PickingInfo;
    pickInfo.hit = true;
    pickInfo.pickedMesh = entity.mesh;
    scene.simulatePointerDown(pickInfo, { pointerId: 8 });
    await new Promise((r) => setTimeout(r, 1100));
    console.log(entity.mesh.position, "posit oin");
    expect(systems.lift.lifts["door1"].state).to.eql("up");
  });
});
