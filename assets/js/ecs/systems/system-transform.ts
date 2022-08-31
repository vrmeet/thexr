import type { Entity } from "../entities/entity";
import type * as BABYLON from "babylonjs";

import type { ISystem } from "./system";
import type { Context } from "../../context";

export class SystemTransform implements ISystem {
  public name = "transform";
  public scene: BABYLON.Scene;
  init(context: Context) {
    this.scene = context.scene;
  }

  initEntity(entity: Entity) {
    this.setPosition(entity);
    this.setRotation(entity);
    this.setScaling(entity);
  }

  setPosition(entity: Entity) {
    if (entity.componentObj.position) {
      entity.transformNode?.position.fromArray(entity.componentObj.position);
    }
  }
  setRotation(entity: Entity) {
    if (entity.componentObj.rotation) {
      entity.transformNode?.rotation.fromArray(entity.componentObj.rotation);
    }
  }
  setScaling(entity: Entity) {
    if (entity.componentObj.scaling) {
      entity.transformNode?.scaling.fromArray(entity.componentObj.scaling);
    }
  }
  dispose() {}
}
