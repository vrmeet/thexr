import * as CreateEventHelper from "../../core/entities/event-helper";
import * as BABYLON from "babylonjs";
import { Entity } from "../../core/entities/entity";
describe("consuming events to create entities", () => {
  let scene: BABYLON.Scene;
  beforeAll(() => {
    let engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });
  test("taking a create entity event and making it in the scene", () => {
    let event = CreateEventHelper.createBoxEvent({ size: 0.1 });
    let entity = new Entity(event.p.entity_id, event.p.components, scene);
    expect(entity.mesh.getClassName()).toEqual("Mesh");
    expect(scene.meshes.length).toEqual(1);
  });
});

export {};
