import { filter, type Subscription } from "rxjs";
import type { SignalHub } from "../../signalHub";
import type { Entity } from "../entity";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";
import type * as BABYLON from "babylonjs";

export class SystemThrowable
  extends BaseSystemWithBehaviors
  implements ISystem
{
  name = "throwable";
  order = 40;
  buildBehavior() {
    return new BehaviorThrowable(this);
  }
}

type ThrowableType = {
  type:
    | "physics_simulator" // use physics imposters, can't predict where this object ends up
    | { linear: number } // animate the object in a straight line at this constant speed M/s
    | { dampening: number }; // slight floaty effect when object is released, object comes to a halt quickly
};

export class BehaviorThrowable implements IBehavior {
  data: ThrowableType;
  entity: Entity;
  signalHub: SignalHub;
  subscriptions: Subscription[];
  constructor(public system: SystemThrowable) {}
  add(entity: Entity, data: ThrowableType): void {
    this.entity = entity;
    this.data = data;
    // listen for a release
    this.signalHub = this.system.xrs.context.signalHub;
    this.makeSubscription("left");
    this.makeSubscription("right");
  }
  update(data: ThrowableType): void {
    this.data = data;
  }
  remove(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  makeSubscription(hand: "left" | "right") {
    this.signalHub.movement
      .on(`${hand}_lost_mesh`)
      .pipe(
        filter(
          (evt) =>
            evt.reason === "released" && evt.mesh.name === this.entity.name
        )
      )
      .subscribe((evt) => {
        this.animateMesh(evt.mesh, evt.input);
      });
  }
  animateMesh(
    mesh: BABYLON.AbstractMesh,
    inputSource: BABYLON.WebXRInputSource
  ) {
    console.log("make this mesh fly");
    // TODO: emit outgoing custom message to
    // throwable system
    /*
    1. physics
    2. linear
    3. slight float
    - let's start with physics, and for 5 seconds
    - if position and rotation are changing, send updated pos/rot for the object
    - every 100 ms, until something else grabs it or 5 seconds is over

    */
  }
}
