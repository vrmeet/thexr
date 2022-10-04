import type * as BABYLON from "babylonjs";

import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";

interface ITransformable {
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
  scaling: BABYLON.Vector3;
}

export class SystemTransform implements ISystem {
  public transforms: { [entity_id: string]: ITransformable } = {};
  public name = "system-transform";
  public order = 3;
  public scene: BABYLON.Scene;
  init(context: Context) {
    this.scene = context.scene;
  }
  upsertComponents(entity_id: string, components: ComponentObj): void {
    this.registerEntity(entity_id, components);
  }
  deregisterEntity(entity_id: string): void {
    delete this.transforms[entity_id];
  }
  registerEntity(entity_id: string, components: ComponentObj) {
    const mesh = this.scene.getMeshByName(entity_id);
    if (mesh) {
      this.transforms[entity_id] = mesh;
    } else {
      const transformNode = this.scene.getTransformNodeByName(entity_id);
      if (transformNode) {
        this.transforms[entity_id] = transformNode;
      }
    }
    if (!this.transforms[entity_id]) {
      return;
    }

    this.setPosition(entity_id, components);
    this.setRotation(entity_id, components);
    this.setScaling(entity_id, components);
  }

  setPosition(entity_id: string, components: ComponentObj) {
    if (components.position) {
      this.transforms[entity_id].position.fromArray(components.position);
    }
  }
  setRotation(entity_id: string, components: ComponentObj) {
    if (components.rotation) {
      this.transforms[entity_id].rotation.fromArray(components.rotation);
    }
  }
  setScaling(entity_id: string, components: ComponentObj) {
    if (components.scaling) {
      this.transforms[entity_id].scaling.fromArray(components.scaling);
    }
  }
  dispose() {}
}