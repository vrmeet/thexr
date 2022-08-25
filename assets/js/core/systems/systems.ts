import { SystemShape } from "./system-shape";
import { SystemLift } from "./system-lift";
import type * as BABYLON from "babylonjs";
import type { Entity } from "../entities/entity";

export class Systems {
  public shape = new SystemShape();
  public lift = new SystemLift();
  initAll(member_id: string, scene: BABYLON.Scene) {
    Object.keys(this).forEach(system => {
      this[system].init(member_id, scene);
    });
  }
  initEntityAll(entity: Entity) {
    Object.keys(this).forEach(system => {
      this[system].initEntity(entity);
    });
  }
}

export const systems = new Systems();
