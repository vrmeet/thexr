import type { Entity } from "../entity";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";
import type * as BABYLON from "babylonjs";

export class SystemVisiblity
  extends BaseSystemWithBehaviors
  implements ISystem
{
  name = "visibility";
  order = 10;
  buildBehavior() {
    return new BehaviorVisiblity(this);
  }
}

export type VisiblityType = { value: number };

export class BehaviorVisiblity implements IBehavior {
  data: VisiblityType;
  entity: Entity;
  scene: BABYLON.Scene;
  mesh: BABYLON.AbstractMesh;
  constructor(public system: SystemVisiblity) {
    this.scene = system.xrs.context.scene;
  }
  add(entity: Entity, data: VisiblityType) {
    this.data = data;
    this.entity = entity;
    this.mesh = entity.transformable as BABYLON.AbstractMesh;
    this.mesh.visibility = data.value;
  }
  update(data: VisiblityType) {
    this.data = data;
    this.mesh.visibility = data.value;
  }
  remove() {
    this.mesh.visibility = 1;
  }
}
