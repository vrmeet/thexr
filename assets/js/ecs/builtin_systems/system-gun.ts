import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import type { SystemXR } from "./system-xr";
import * as BABYLON from "babylonjs";
import type { SignalHub } from "../../signalHub";
import { filter, switchMap, takeUntil } from "rxjs";
import { arrayReduceSigFigs } from "../../utils/misc";

/*
a particular implementation of a gun
*/

type FireBulletEvent = {
  name: "fire_bullet";
  shooter: string;
  gun: string;
  pos: number[];
  direction: number[];
};

export class SystemGun implements ISystem {
  public name = "gun";
  public order = 30;
  public context: Context;
  public signalHub: SignalHub;
  init(context: Context) {
    this.context = context;
    this.signalHub = this.context.signalHub;
    this.signalHub.movement
      .on("trigger_holding_mesh")
      .pipe(
        filter(
          (evt) =>
            this.context.state[evt.mesh.name] !== undefined &&
            this.context.state[evt.mesh.name].gun !== undefined
        )
      )
      .subscribe((evt) => {
        // fire a bullet if we have ammo
        console.log("fire a bullet");
        this.signalHub.outgoing.emit("msg", {
          system: "gun",
          data: <FireBulletEvent>{
            name: "fire_bullet",
            shooter: this.context.my_member_id,
            gun: evt.mesh.name,
            pos: arrayReduceSigFigs(
              evt.inputSource.grip.absolutePosition.asArray()
            ),
            direction: arrayReduceSigFigs(
              evt.inputSource.pointer.forward.asArray()
            ),
          },
        });
      });

    // replenish ammo if I pick up a collectable...

    // animate (destroy a target if MY bullet hits it)

    // animate a bullet when given that message
  }

  // this method called on custom msg that matches system name
  process_msg(data: FireBulletEvent) {
    console.log("a bulelt was fired", data);
  }
}
