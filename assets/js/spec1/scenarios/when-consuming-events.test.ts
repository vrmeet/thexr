import * as CreateEventHelper from "../../core/entities/event-helper";
import * as BABYLON from "babylonjs";
import { Entity } from "../../core/entities/entity";
import type { EventEntityCreated } from "../../core/events/entity-created";

class MockPointerEvent {}

describe("consuming events to create entities", () => {
  let engine: BABYLON.Engine = new BABYLON.NullEngine();
  let scene: BABYLON.Scene;

  beforeEach(() => {
    scene = new BABYLON.Scene(engine);
    global.window.PointerEvent = MockPointerEvent as any;
  });
  afterEach(() => {
    scene.dispose();
  });

  it("there is always a default mesh shape for any entity", () => {
    // if you manually create an event with no components
    let event: EventEntityCreated = {
      m: "entity_created",
      p: { entity_id: "123", components: {} },
    };
    // and load an entity from that event
    let entity = new Entity(event.p.entity_id, event.p.components, scene);
    // you still have a mesh
    expect(entity.mesh).toBeTruthy();
  });

  it("taking a create entity event and making it in the scene", () => {
    let event = CreateEventHelper.createBoxEvent({ size: 0.1 });
    let entity = new Entity(event.p.entity_id, event.p.components, scene);
    expect(entity.mesh.getClassName()).toEqual("Mesh");
    expect(scene.meshes.length).toEqual(1);
  });

  it("a door will have a behavior", () => {
    // let event = CreateEventHelper.createDoorEvent({ points: [1, 2, 3, 4] });
    // let entity = new Entity(event.p.entity_id, event.p.components, scene);

    // let pickInfo = scene.pick(0, 0);
    // pickInfo.hit = true;
    // pickInfo.pickedMesh = entity.mesh;
    scene.simulatePointerDown(scene.pick(3, 5), { pointerId: 1 });
  });
});

export {};
