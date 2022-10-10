import type * as BABYLON from "babylonjs";
import type { Context } from "../../context";
import type { Subscription } from "rxjs";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "../builtin_systems/isystem";

class SystemLift implements ISystem {
  public name = "acts_like_lift";
  public order = 20;
  public scene: BABYLON.Scene;
  public meshPickedSubscription: Subscription;
  public context: Context;
  init(context: Context) {
    this.context = context;
    this.meshPickedSubscription = context.signalHub.local
      .on("mesh_picked")
      .subscribe((mesh) => {
        if (this.meshIsALift(mesh)) {
          this.toggleLift(mesh);
        }
      });
  }

  registerEntity(entity_id: string, components: ComponentObj) {
    if (components.acts_like_lift !== undefined) {
      this.context.state[entity_id]["acts_like_lift"] = {
        height: components.acts_like_lift.height || 2,
        speed: components.acts_like_lift.speed || 1,
        state: components.acts_like_lift.state || "down",
      };
    }
  }

  upsertComponents(entity_id: string, components: ComponentObj) {
    if (components.acts_like_lift !== undefined) {
      const mesh = this.context.scene.getMeshByName(entity_id);
      if (mesh) {
        if (components.acts_like_lift.state === "going-down") {
          this.goDown(mesh);
        } else if (components.acts_like_lift.state === "going-up") {
          this.goUp(mesh);
        }
      }
    }
  }

  deregisterEntity(_entity_id: string): void {}

  meshIsALift(mesh): boolean {
    return (
      this.context.state[mesh.name] !== undefined &&
      this.context.state[mesh.name]["acts_like_lift"] !== undefined
    );
  }

  toggleLift(mesh: BABYLON.AbstractMesh) {
    const liftState = this.context.state[mesh.name].acts_like_lift;
    if (liftState.state === "up") {
      liftState.state = "going-down";
      this.context.signalHub.outgoing.emit("components_upserted", {
        id: mesh.name,
        components: {
          acts_like_lift: { ...liftState, state: "going-down" },
        },
      });
    } else if (liftState.state === "down") {
      liftState.state = "going-up";
      this.context.signalHub.outgoing.emit("components_upserted", {
        id: mesh.name,
        components: {
          acts_like_lift: { ...liftState, state: "going-up" },
        },
      });
    }
  }

  goDown(mesh: BABYLON.AbstractMesh) {
    const liftState = this.context.state[mesh.name].acts_like_lift;
    this.context.signalHub.service.emit("animate_translate", {
      target: mesh,
      from: mesh.position,
      to: mesh.position.subtractFromFloats(0, liftState.height, 0),
      duration: liftState.height / liftState.speed,
      callback: () => {
        this.context.signalHub.outgoing.emit("components_upserted", {
          id: mesh.name,
          components: {
            acts_like_lift: { ...liftState, state: "down" },
            transform: { position: mesh.position.asArray() },
          },
        });
      },
    });
  }

  goUp(mesh: BABYLON.AbstractMesh) {
    const liftState = this.context.state[mesh.name].acts_like_lift;
    this.context.signalHub.service.emit("animate_translate", {
      target: mesh,
      from: mesh.position,
      to: mesh.position.add(
        new this.context.BABYLON.Vector3(0, liftState.height, 0)
      ),
      duration: liftState.height / liftState.speed,
      callback: () => {
        this.context.signalHub.outgoing.emit("components_upserted", {
          id: mesh.name,
          components: {
            acts_like_lift: { ...liftState, state: "up" },
            transform: { position: mesh.position.asArray() },
          },
        });
      },
    });
  }

  dispose() {
    this.meshPickedSubscription.unsubscribe();
  }
}
window["system-lift"] = new SystemLift();
