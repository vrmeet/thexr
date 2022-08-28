import type { Entity } from "../entities/entity";
import * as BABYLON from "babylonjs";
import { cap } from "../../utils/misc";
import { SystemBase } from "./system-base";
import { signalHub } from "../../signalHub";

export class SystemGun extends SystemBase {
  public entities: { [entity_name: string]: Entity };
  afterInit(): void {
    this.entities = {};
    /*
    if one of my entities is gripped, set up a subscription until it is released or stolen
    or until exit XR

    in the subscription, if trigger is squeezed, then emit gun_trigger_squeezed
    */
    signalHub.movement.on("right_grip_mesh");
  }

  initEntity(entity: Entity) {
    if (entity.componentObj.acts_like_gun) {
      this.entities[entity.name] = entity;
    }
  }
}
