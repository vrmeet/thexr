import type { ISystem } from "../system";
import type * as BABYLON from "babylonjs";
import type { Context } from "../../context";
import type { Subscription } from "rxjs";
import type { ComponentObj } from "../components/component-obj";
import type { ActsLikeLiftComponent } from "../components/acts-like-lift";

class SystemLift implements ISystem {
  public name = "system-lift";
  public scene: BABYLON.Scene;
  public meshPickedSubscription: Subscription;
  public context: Context;
  init(context: Context) {
    this.context = context;
    this.meshPickedSubscription = context.signalHub.local
      .on("mesh_picked")
      .subscribe((mesh) => {
        console.log("inside mesh_picked", mesh);
        const liftState = this.meshIsALift(mesh);
        if (liftState) {
          this.toggleLift(mesh, liftState);
        }
      });
  }

  initEntity(entity_id: string, components: ComponentObj): void {
    if (components.acts_like_lift) {
      this.context.state[entity_id]["acts_like_lift"] = {
        height: components.acts_like_lift.height || 2,
        speed: components.acts_like_lift.speed || 1,
        state: components.acts_like_lift.state || "down",
      };
    }
  }

  meshIsALift(mesh): ActsLikeLiftComponent {
    return this.context.state[mesh.name]["acts_like_lift"];
  }

  toggleLift(mesh: BABYLON.AbstractMesh, liftState: ActsLikeLiftComponent) {
    if (liftState.state === "up") {
      this.goDown(mesh, liftState);
    } else if (liftState.state === "down") {
      this.goUp(mesh, liftState);
    }
  }

  goDown(mesh: BABYLON.AbstractMesh, liftState: ActsLikeLiftComponent) {
    liftState.state = "going-down";
    console.log("going down");
    this.context.signalHub.service.emit("animate_translate", {
      target: mesh,
      from: mesh.position,
      to: mesh.position.subtractFromFloats(0, liftState.height, 0),
      duration: liftState.height / liftState.speed,
      callback: () => {
        liftState.state = "down";
        console.log("down");
      },
    });
  }

  goUp(mesh: BABYLON.AbstractMesh, liftState: ActsLikeLiftComponent) {
    liftState.state = "going-up";
    console.log("going up", liftState);
    this.context.signalHub.service.emit("animate_translate", {
      target: mesh,
      from: mesh.position,
      to: mesh.position.add(
        new this.context.BABYLON.Vector3(0, liftState.height, 0)
      ),
      duration: liftState.height / liftState.speed,
      callback: () => {
        console.log("animation ended");
        liftState.state = "up";
      },
    });
  }

  dispose() {
    this.meshPickedSubscription.unsubscribe();
  }
}
window["system-lift"] = new SystemLift();
