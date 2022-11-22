import type { Context } from "../context";
import type { Entity } from "../entity";
import { BaseSystemWithBehaviors, type IBehavior } from "../system";
import * as BABYLON from "babylonjs";

export class SystemLighting extends BaseSystemWithBehaviors {
  public name = "lighting";
  buildBehavior(): IBehavior {
    return new BehaviorLighting(this.xrs.context, this);
  }
}

export class BehaviorLighting implements IBehavior {
  public data: any;
  public entity: Entity;
  public light: BABYLON.Light;
  constructor(public context: Context, public system: SystemLighting) {}
  add(entity: Entity, data) {
    this.entity = entity;
    this.data = data;
    this.light = this.createLight();
  }
  update(data) {
    this.remove();
    this.light = this.createLight();
  }
  remove() {
    this.light?.dispose();
    this.light = null;
  }

  createLight() {
    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    return new BABYLON.HemisphericLight(
      this.entity.name,
      new BABYLON.Vector3(0, 1, 0),
      this.context.scene
    );
  }
}
