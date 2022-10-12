import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import type { SystemXR } from "./system-xr";
import * as BABYLON from "babylonjs";
import type { SignalHub } from "../../signalHub";
import { switchMap, takeUntil } from "rxjs";

/*
things marked as floor should be teleportable, also physics objects should no penetrate them

*/

export class SystemShootable implements ISystem {
  public name = "shootable";
  public order = 30;
  public context: Context;
  public signalHub: SignalHub;
  init(context: Context) {
    this.context = context;
    this.signalHub = this.context.signalHub;
    const hand = "left";
    const ref = BABYLON.MeshBuilder.CreateBox(
      "ref",
      { size: 0.05 },
      this.context.scene
    );
    ref.setEnabled(false);
    this.signalHub.movement.on("left_grip_mesh").subscribe(() => {
      this.signalHub.movement
        .on("left_trigger_squeezed")
        .pipe(takeUntil(this.signalHub.movement.on("left_lost_mesh")))
        .subscribe((inputSource) => {
          console.log("fire!");
          const clone = ref.clone("");
          clone.position.copyFrom(inputSource.grip.position);
          clone.setEnabled(true);
        });
    });
  }
}
