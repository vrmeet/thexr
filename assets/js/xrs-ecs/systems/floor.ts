import type { Entity } from "../entity";
import { BaseSystemWithBehaviors, type IBehavior } from "../system";
import type { XRS } from "../xrs";
import type { SystemXR } from "./xr";
import * as BABYLON from "babylonjs";
import { filter, take } from "rxjs";

export class SystemFloor extends BaseSystemWithBehaviors {
  name = "floor";
  public systemXR: SystemXR;
  setup(xrs: XRS) {
    this.xrs = xrs;
    this.systemXR = this.xrs.context.systems["xr"] as SystemXR;
  }
  buildBehavior(): IBehavior {
    return new BehaviorFloor(this.xrs, this);
  }
  addFloor(floorName: string) {
    const mesh = this.xrs.context.scene.getMeshByName(floorName);
    if (mesh) {
      this.systemXR.teleportation.addFloorMesh(mesh);
      mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
        mesh,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.5, restitution: 0.7 },
        this.xrs.context.scene
      );
      mesh.checkCollisions = true;
    }
  }
  removeFloor(floorName: string) {
    const mesh = this.xrs.context.scene.getMeshByName(floorName);
    if (mesh && this.systemXR.teleportation) {
      this.systemXR.teleportation.removeFloorMesh(mesh);
      mesh.physicsImpostor?.dispose();
      mesh.physicsImpostor = null;
      mesh.checkCollisions = false;
    }
  }
}

export class BehaviorFloor implements IBehavior {
  public data: any;
  public entity: Entity;
  public enteringXR$;
  constructor(public xrs: XRS, public system: SystemFloor) {
    this.enteringXR$ = xrs.context.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.ENTERING_XR));
  }
  add(entity: Entity, data: any): void {
    this.entity = entity;
    this.data = data;
    if (this.system.systemXR.teleportation) {
      this.system.addFloor(this.entity.name);
    } else {
      // teleportation won't be ready until the start modal has been dismissed
      // in that case wait for XR ENTER to bind the floors
      this.enteringXR$.pipe(take(1)).subscribe(() => {
        this.system.addFloor(entity.name);
      });
    }
  }
  update(_data: any): void {}
  remove(): void {
    this.system.removeFloor(this.entity.name);
  }
}
