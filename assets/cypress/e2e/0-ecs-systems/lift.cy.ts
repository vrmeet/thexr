/// <reference types="cypress" />

import type { Synergize } from "../../../js/synergizer";
import { random_id } from "../../../js/utils/misc";
import type { ComponentObj } from "../../../js/ecs/components/component-obj";
import type * as BABYLON from "babylonjs";
describe("lift system", () => {
  let synergizer: Synergize;
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit("http://localhost:4000/test/blank");
    cy.get("canvas").click();
    cy.window().then(async (win) => {
      synergizer = win["synergizer"] as Synergize;
      synergizer.debug();
      await synergizer.addSystem(
        "http://localhost:4000/systems/system-lighting.js",
        "system-lighting"
      );
      await synergizer.addSystem(
        "http://localhost:4000/systems/system-shape.js",
        "system-shape"
      );
      await synergizer.addSystem(
        "http://localhost:4000/systems/system-transform.js",
        "system-transform"
      );
      await synergizer.addSystem(
        "http://localhost:4000/systems/system-material.js",
        "system-material"
      );
      await synergizer.addSystem(
        "http://localhost:4000/systems/system-lift.js",
        "system-lift"
      );
      console.log("systems", synergizer.systems);
      //create a light
      const event = {
        id: `light_${random_id(3)}`,
        components: {
          lighting: true,
        },
      };
      synergizer.context.signalHub.incoming.emit("entity_created", event);
    });
  });

  it("door goes up", () => {
    const entity_id = "door1";
    const event = {
      id: entity_id,
      components: <ComponentObj>{
        shape: { prim: "box", prim_params: {} },
        position: [0, 0, 4],
        acts_like_lift: { height: 2, speed: 0.01, state: "down" },
      },
    };
    synergizer.context.signalHub.incoming.emit("entity_created", event);
    cy.wait(200).then(() => {
      const pickInfo = synergizer.scene.pick(0, 0) as BABYLON.PickingInfo;
      pickInfo.hit = true;
      pickInfo.pickedMesh = synergizer.scene.getMeshByName(entity_id);
      synergizer.scene.simulatePointerDown(pickInfo, { pointerId: 8 });

      cy.wait(1100).then(() => {
        console.log(synergizer.context.state);
        expect(
          synergizer.context.state[entity_id]["acts_like_lift"].state
        ).to.eql("up");
      });
    });

    // await new Promise((r) => setTimeout(r, 1100));
  });
});

// describe("lift system", () => {
//   const engine: BABYLON.Engine = new BABYLON.NullEngine();
//   let scene: BABYLON.Scene;

//   beforeEach(() => {
//     scene = new BABYLON.Scene(engine);
//     const freeCamera = new BABYLON.FreeCamera(
//       "freeCam",
//       BABYLON.Vector3.FromArray([1, 2, 3]),
//       scene
//     );
//     bindSceneObservablesToSignalHub(scene);
//     systems.initAll("me", scene);

//     engine.runRenderLoop(() => {
//       scene.render();
//     });
//   });

//   it("door goes up when clicked", async () => {
//     const entity = new Entity("door1", { acts_like_lift: {} }, scene);
//     expect(systems.lift.lifts["door1"].state).to.eql("down");

//     const pickInfo = scene.pick(0, 0) as BABYLON.PickingInfo;
//     pickInfo.hit = true;
//     pickInfo.pickedMesh = entity.mesh;
//     scene.simulatePointerDown(pickInfo, { pointerId: 8 });
//     await new Promise((r) => setTimeout(r, 1100));
//     console.log(entity.mesh.position, "posit oin");
//     expect(systems.lift.lifts["door1"].state).to.eql("up");
//   });
// });
