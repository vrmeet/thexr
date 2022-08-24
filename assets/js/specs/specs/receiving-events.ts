import { describe, test, beforeEach } from "../helper/runner";

import * as BABYLON from "babylonjs";
import { Entity } from "../../core/entities/entity";
import type { EventEntityCreated } from "../../core/events/entity-created";
import * as CreateEventHelper from "../../core/entities/event-helper";
import { assert, expect } from "chai";

describe("consuming events to create entities", () => {
  let engine: BABYLON.Engine = new BABYLON.NullEngine();
  let scene: BABYLON.Scene;

  beforeEach(() => {
    if (scene) {
      scene.dispose();
    }
    scene = new BABYLON.Scene(engine);
  });

  test("there is always a default mesh shape for any entity", () => {
    // if you manually create an event with no components
    let event: EventEntityCreated = {
      m: "entity_created",
      p: { entity_id: "123", components: {} },
    };
    // and load an entity from that event
    let entity = new Entity(event.p.entity_id, event.p.components, scene);
    // you still have a mesh
    console.log("entity mesh is", entity.mesh);
    assert.typeOf(entity.mesh, "Object");
  });

  test("the scene will have a mesh", () => {
    let event = CreateEventHelper.createBoxEvent({ size: 0.1 });
    let entity = new Entity(event.p.entity_id, event.p.components, scene);
    expect(entity.mesh.getClassName()).to.equal("Mesh");
    expect(scene.meshes.length).to.equal(1);
  });

  test("door", () => {
    let event = CreateEventHelper.createDoorEvent({ points: [1, 2, 3, 4] });
    let entity = new Entity(event.p.entity_id, event.p.components, scene);

    let pickInfo = scene.pick(0, 0);
    pickInfo.hit = true;
    pickInfo.pickedMesh = entity.mesh;
    scene.simulatePointerDown(pickInfo, { pointerId: 8 });
  });
});
