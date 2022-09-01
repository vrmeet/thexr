/// <reference types="cypress" />

import type { Synergize } from "../../../js/synergizer";
import { SystemShape } from "../../../js/ecs/systems/system-shape";
import { SystemLift } from "../../../js/ecs/systems/system-lift";
import { EventName } from "../../../js/event-names";
import type * as BABYLON from "babylonjs";
import type { ComponentObj } from "../../../js/ecs/components/component-obj";
import type { IEntityCreatedEvent } from "../../../js/types";
import { SystemTransform } from "../../../js/ecs/systems/system-transform";

describe("lift system", () => {
  let synergizer: Synergize;
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit("http://localhost:4000/test");
    cy.get("canvas").click();
    cy.window().then((win) => {
      synergizer = win["synergizer"] as Synergize;
      // synergizer.addSystem(new SystemShape());
      // synergizer.addSystem(new SystemTransform());
      // synergizer.addSystem(new SystemLift());
    });
  });

  it("door goes up", () => {
    const entity_id = "door1";
    const event: IEntityCreatedEvent = {
      m: EventName.entity_created2,
      p: {
        entity_id: entity_id,
        components: <ComponentObj>{
          shape: { prim: "box", prim_params: {} },
          position: [0, 0.5, 0],
          acts_like_lift: {},
        },
      },
    };
    synergizer.context.signalHub.incoming.emit("event", event as any);
    console.log("synergizer", synergizer);
    const liftSystem = synergizer.getSystemByName("lift") as SystemLift;
    console.log("lfit system", liftSystem);
    expect(liftSystem.lifts[entity_id].state).to.eql("down");
    expect(liftSystem.lifts[entity_id].entity.transformNode.position.y).to.eql(
      0.5
    );
    const pickInfo = synergizer.scene.pick(0, 0) as BABYLON.PickingInfo;
    pickInfo.hit = true;
    pickInfo.pickedMesh = synergizer.scene.getMeshByName(entity_id);
    synergizer.scene.simulatePointerDown(pickInfo, { pointerId: 8 });
    cy.wait(1100).then(() => {
      expect(liftSystem.lifts["door1"].state).to.eql("up");
      expect(
        liftSystem.lifts[entity_id].entity.transformNode.position.y
      ).to.greaterThan(0.5);
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
