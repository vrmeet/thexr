import type * as BABYLON from "babylonjs";

import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";

export class SystemLighting implements ISystem {
  public lights: { [entity_name: string]: BABYLON.Light } = {};
  public name = "system-lighting";
  public order = 1;
  public scene: BABYLON.Scene;
  public context: Context;
  init(context: Context) {
    this.context = context;
    this.scene = context.scene;
  }

  registerEntity(entity_id: string, components: ComponentObj) {
    if (components.lighting) {
      if (!this.lights[entity_id]) {
        this.lights[entity_id] = this.createLight(entity_id, components);
      }
    }
  }

  upsertComponents(
    entity_id: string,
    _oldComponents: ComponentObj,
    newComponents: ComponentObj
  ) {
    if (
      newComponents.lighting != undefined &&
      this.lights[entity_id] !== undefined
    ) {
      this.lights[entity_id].dispose();
      this.lights[entity_id] = this.createLight(entity_id, newComponents);
    }
  }

  deregisterEntity(entity_id: string): void {
    if (this.lights[entity_id] !== undefined) {
      this.lights[entity_id].dispose();
      delete this.lights[entity_id];
    }
  }

  createLight(entity_id: string, components: ComponentObj) {
    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    return new this.context.BABYLON.HemisphericLight(
      entity_id,
      new this.context.BABYLON.Vector3(0, 1, 0),
      this.scene
    );
  }

  dispose() {}
}
