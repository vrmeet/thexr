import type * as BABYLON from "babylonjs";

import type { ISystem } from "../system";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";

class SystemLighting implements ISystem {
  public lights: { [entity_name: string]: BABYLON.Light } = {};
  public name = "lighting";
  public scene: BABYLON.Scene;
  public context: Context;
  init(context: Context) {
    this.context = context;
    this.scene = context.scene;
  }

  initEntity(entity_id: string, components: ComponentObj) {
    if (components.lighting) {
      this.lights[entity_id] = this.createLight(entity_id, components);
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

window["system-lighting"] = new SystemLighting();
