import { animateTranslation } from "../../utils/misc";
import * as BABYLON from "babylonjs";
export class SystemLift {
  constructor() {
    this.lifts = {};
    this.name = "lift";
  }
  init(context) {
    this.scene = context.scene;
    this.meshPickedSubscription = context.signalHub.local.on("mesh_picked").subscribe((mesh) => {
      console.log("inside mesh_picked", mesh);
      const liftState = this.meshIsALift(mesh);
      if (liftState) {
        this.toggleLift(liftState);
      }
    });
  }
  initEntity(entity) {
    if (entity.componentObj.acts_like_lift) {
      this.lifts[entity.name] = {
        entity,
        height: entity.componentObj.acts_like_lift.height || 2,
        speed: entity.componentObj.acts_like_lift.speed || 10,
        state: entity.componentObj.acts_like_lift.initial_state || "down"
      };
    }
  }
  meshIsALift(mesh) {
    return this.lifts[mesh.name];
  }
  toggleLift(liftState) {
    if (liftState.state === "up") {
      this.goDown(liftState);
    } else if (liftState.state === "down") {
      this.goUp(liftState);
    }
  }
  goDown(liftState) {
    liftState.state = "going-down";
    console.log("going down");
    animateTranslation(liftState.entity, liftState.entity.transformNode.position.subtractFromFloats(0, liftState.height, 0), 1e3, () => {
      liftState.state = "down";
      console.log("down");
    }, this.scene);
  }
  goUp(liftState) {
    liftState.state = "going-up";
    console.log("going up", liftState);
    animateTranslation(liftState.entity, liftState.entity.transformNode.position.add(new BABYLON.Vector3(0, liftState.height, 0)), 1e3, () => {
      console.log("animation endeds");
      liftState.state = "up";
    }, this.scene);
  }
  dispose() {
    this.lifts = {};
    this.meshPickedSubscription.unsubscribe();
  }
}
