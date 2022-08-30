import type { Entity } from "../entities/entity";
import { animateTranslation } from "../../utils/misc";
import type { ISystem } from "./system";
import type { Context } from "../../context";
import type * as BABYLON from "babylonjs";
import type { Subscription } from "rxjs";

interface LiftState {
  entity: Entity;
  height: number;
  speed: number;
  state: "up" | "down" | "going-up" | "going-down";
}

export class SystemLift implements ISystem {
  public lifts: { [entity_name: string]: LiftState } = {};
  public name = "lift";
  public scene: BABYLON.Scene;
  public meshPickedSubscription: Subscription;

  init(context: Context) {
    this.scene = context.scene;
    this.meshPickedSubscription = context.signalHub.local
      .on("mesh_picked")
      .subscribe((mesh) => {
        console.log("inside mesh_picked", mesh);
        const liftState = this.meshIsALift(mesh);
        if (liftState) {
          this.toggleLift(liftState);
        }
      });
  }

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
    console.log("going up", liftState);
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

  dispose() {
    this.lifts = {};
    this.meshPickedSubscription.unsubscribe();
  }
}
