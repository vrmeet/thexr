import type { Entity } from "../entities/entity";
import { SystemBase } from "./system-base";
import { signalHub } from "../../signalHub";
import { animateTranslation } from "../../utils/misc";

interface LiftState {
  entity: Entity;
  height: number;
  speed: number;
  state: "up" | "down" | "going-up" | "going-down";
}

export class SystemLift extends SystemBase {
  public lifts: { [entity_name: string]: LiftState };
  public name = "lift";

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
    console.log("creating subscription");
    signalHub.local.on("mesh_picked").subscribe((mesh) => {
      console.log("inside mesh_picked");
      const liftState = this.meshIsALift(mesh);
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
    liftState.state = "going-down";
    console.log("going down");
    animateTranslation(
      liftState.entity,
      liftState.entity.mesh.position.subtractFromFloats(
        0,
        -liftState.height,
        0
      ),
      1000,
      () => {
        liftState.state = "down";
        console.log("down");
      },
      this.scene
    );
  }

  goUp(liftState: LiftState) {
    liftState.state = "going-up";

    animateTranslation(
      liftState.entity,
      liftState.entity.mesh.position.subtractFromFloats(0, liftState.height, 0),
      1000,
      () => {
        console.log("animation endeds");
        liftState.state = "up";
      },
      this.scene
    );
  }
}
