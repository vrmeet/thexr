import type { Entity } from "../entities/entity";
import * as BABYLON from "babylonjs";

import type { ISystem } from "./system";
import type { Context } from "../../context";

export class SystemLighting implements ISystem {
  public entities: { [entity_name: string]: Entity } = {};
  public name = "lighting";
  public scene: BABYLON.Scene;
  init(context: Context) {
    this.scene = context.scene;
  }

  initEntity(entity: Entity) {
    if (entity.componentObj.lighting) {
      this.entities[entity.name] = entity;
      this.createLight(entity);
    }
  }

  createLight(entity: Entity) {
    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    entity.transformNode = new BABYLON.TransformNode(entity.name, this.scene);
    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    light.parent = entity.transformNode;
  }

  dispose() {}
}
