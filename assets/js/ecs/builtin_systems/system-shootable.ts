import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import type { SystemXR } from "./system-xr";
import * as BABYLON from "babylonjs";
import type { SignalHub } from "../../signalHub";
import { filter, switchMap, takeUntil } from "rxjs";

/*
a particular implementation of a gun
*/

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
        console.log("fire a bullet");
      });
  }
}
