import { filter, type Subscription } from "rxjs";
import type { SignalHub } from "../../signalHub";
import type { Entity } from "../entity";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";
import * as BABYLON from "babylonjs";
import type { SystemXR } from "./xr";
import { arrayReduceSigFigs } from "../../utils/misc";
import type { Context } from "../context";

export class SystemThrowable
  extends BaseSystemWithBehaviors
  implements ISystem
{
  name = "throwable";
  order = 40;
  buildBehavior() {
    return new BehaviorThrowable(this);
  }
  processMsg(data: {
    throw: string;
    av: number[];
    lv: number[];
    pos: number[];
    rot: number[];
  }): void {
    console.log("receiving a throwable message");
    // handle throw
    const thrownObject = this.xrs.context.scene.getMeshByName(data.throw);
    // reset pos, rot for more accurate client simulations
    thrownObject.position = BABYLON.Vector3.FromArray(data.pos);
    thrownObject.rotation = BABYLON.Vector3.FromArray(data.rot);
    if (!thrownObject.physicsImpostor) {
      thrownObject.physicsImpostor = new BABYLON.PhysicsImpostor(
        thrownObject,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 1, friction: 0.8, restitution: 0.5 },
        this.xrs.context.scene
      );
    }
    thrownObject.physicsImpostor.setLinearVelocity(
      BABYLON.Vector3.FromArray(data.lv)
    );
    thrownObject.physicsImpostor.setAngularVelocity(
      BABYLON.Vector3.FromArray(data.av)
    );
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
  subscriptions: Subscription[] = [];
  systemXR: SystemXR;
  context: Context;
  constructor(public system: SystemThrowable) {}

  add(entity: Entity, data: ThrowableType): void {
    this.entity = entity;
    this.data = data;
    this.systemXR = this.system.xrs.getSystem("xr") as SystemXR;
    // listen for a release
    this.context = this.system.xrs.context;
    this.signalHub = this.context.signalHub;
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
    const sub = this.signalHub.movement
      .on(`${hand}_lost_mesh`)
      .pipe(
        filter(
          (evt) =>
            evt.reason === "released" && evt.mesh.name === this.entity.name
        )
      )
      .subscribe((evt) => {
        this.emitFlightType(evt.mesh, hand);
      });

    this.subscriptions.push(sub);
  }
  emitFlightType(thrownObject: BABYLON.AbstractMesh, hand: "left" | "right") {
    const { av, lv } = this.systemXR.getHandVelocity(hand);
    this.context.signalHub.outgoing.emit("msg", {
      system: "throwable",
      data: {
        throw: thrownObject.name,
        av,
        lv,
        pos: arrayReduceSigFigs(thrownObject.getAbsolutePosition().asArray()),
        rot: arrayReduceSigFigs(thrownObject.rotation.asArray()),
      },
    });

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
