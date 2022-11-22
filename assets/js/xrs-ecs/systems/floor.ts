import type { Entity } from "../entity";
import { BaseSystemWithBehaviors, type IBehavior } from "../system";
import type { XRS } from "../xrs";

export class SystemFloor extends BaseSystemWithBehaviors {
  name = "floor";
  buildBehavior(): IBehavior {
    return new BehaviorFloor(this.xrs, this);
  }
}

export class BehaviorFloor implements IBehavior {
  public data: any;
  public entity: Entity;
  constructor(public xrs: XRS, public system: SystemFloor) {}
  add(entity: Entity, data: any): void {
    this.entity = entity;
    this.data = data;
  }
  update(_data: any): void {}
  remove(): void {}
}
