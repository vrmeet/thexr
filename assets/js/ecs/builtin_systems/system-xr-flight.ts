import { filter, takeUntil, map } from "rxjs";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";

export class SystemXRFlight implements ISystem {
  public context: Context;
  public name = "system-xr-flight";
  public order = 20;

  init(context: Context) {
    this.context = context;
    this.context.signalHub.movement
      .on("left_thumbstick")
      .subscribe((component) => {
        console.log(component);
      });
  }
}
