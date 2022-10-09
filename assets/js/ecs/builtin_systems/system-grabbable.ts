import { filter, takeUntil, map } from "rxjs";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";

/**
 * Doesn't modify scene, but detects if palm has a mesh with grabbable component underneath it
 * And emits a mesh grabbed message.
 * Doesn't parent anything because maybe you want to collect an item rather than pick it up
 *
 */
export class SystemGrabbable implements ISystem {
  public context: Context;
  public name = "system-grabbable";
  public order = 20;
  public exitingXR$;
  init(context: Context) {
    this.context = context;

    this.exitingXR$ = this.context.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR));

    this.listen("left");
    this.listen("right");
  }

  listen(hand: "left" | "right") {
    this.context.signalHub.movement
      .on(`${hand}_grip_squeezed`)
      .pipe(
        takeUntil(this.exitingXR$),
        map((inputSource) => {
          return { mesh: this.findGrabbableMesh(inputSource), inputSource };
        }),
        filter(({ mesh }) => mesh !== null)
      )
      .subscribe((data) => {
        this.context.signalHub.movement.emit(`${hand}_grip_mesh`, data.mesh);
      });
  }

  findGrabbableMesh(
    inputSource: BABYLON.WebXRInputSource
  ): BABYLON.AbstractMesh {
    // ray points right on left grip, points left on right grip
    const offset = inputSource.motionController.handness[0] === "l" ? 1 : -1;
    const localDirection = new BABYLON.Vector3(offset, 0, 0);
    const gripWorldMatrix = inputSource.grip.getWorldMatrix();
    // transform local vector into world space, however the grip is orientated
    const worldDirection = BABYLON.Vector3.TransformNormal(
      localDirection,
      gripWorldMatrix
    );

    const origin = inputSource.grip.position.clone();
    const ray = new BABYLON.Ray(origin, worldDirection, 0.25);

    const rayHelper = new BABYLON.RayHelper(ray);
    rayHelper.show(this.context.scene, BABYLON.Color3.Red());
    const pickInfo = this.context.scene.pickWithRay(ray);
    if (
      pickInfo.pickedMesh &&
      this.context.state[pickInfo.pickedMesh.name] !== undefined &&
      this.context.state[pickInfo.pickedMesh.name].grabbable !== undefined
    ) {
      return pickInfo.pickedMesh;
    }
    return null;
  }
}
