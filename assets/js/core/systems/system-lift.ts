import type { Entity } from "../entities/entity";
import type * as BABYLON from "babylonjs";
import { SystemBase } from "./system-base";
import { signalHub } from "../../signalHub";

type LiftState = {
  entity: Entity;
  height: number;
  speed: number;
  state: "up" | "down" | "going-up" | "going-down";
};

export class SystemLift extends SystemBase {
  public lifts: { [entity_name: string]: LiftState };

  initEntity(entity: Entity): void {
    if (entity.componentObj.acts_like_lift) {
      this.lifts[entity.name] = {
        entity,
        height: entity.componentObj.acts_like_lift.height || 2,
        speed: entity.componentObj.acts_like_lift.speed || 10,
        state: entity.componentObj.acts_like_lift.initial_state || "down",
      };
    }
  }

  meshIsALift(mesh): LiftState | undefined {
    return this.lifts[mesh.name];
  }

  afterInit(): void {
    this.lifts = {};
    console.log("creating subscription")
    signalHub.local.on("mesh_picked").subscribe(mesh => {
      console.log("inside mesh_picked")
      let liftState = this.meshIsALift(mesh);
      if (liftState) {
        this.toggleLift(liftState);
      }
    });
  }

  toggleLift(liftState: LiftState) {
    if (liftState.state === "up") {
      this.goDown(liftState);
    } else if (liftState.state === "down") {
      this.goUp(liftState);
    }
  }

  goDown(liftState: LiftState) {
    liftState.state = "down";
  }

  goUp(liftState: LiftState) {
    liftState.state = "up";
  }
}
