import { filter, takeUntil, map } from "rxjs";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";

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
    this.context.signalHub.local.on("controller_ready").subscribe((payload) => {
      const origin = BABYLON.Vector3.Zero();
      const end = BABYLON.Vector3.Forward();
      const mat = payload.grip.getWorldMatrix();
      const ray = BABYLON.Ray.CreateNewFromTo(origin, end, mat);

      // const direction = payload.grip.forward;

      // const vec = origin.subtract(direction);
      // const quat = BABYLON.Quaternion.FromEulerAngles(
      //   BABYLON.Angle.FromDegrees(180).radians(),
      //   0,
      //   0
      // );
      // const vec2 = BABYLON.Vector3.Zero();
      // vec.rotateByQuaternionToRef(quat, vec2);

      // const ray = new BABYLON.Ray(origin, vec2, 0.5);

      const rayHelper = new BABYLON.RayHelper(ray);
      rayHelper.show(this.context.scene, BABYLON.Color3.Green());
    });
  }

  listen(hand: "left" | "right") {
    this.context.signalHub.movement
      .on(`${hand}_grip_squeezed`)
      .pipe(
        takeUntil(this.exitingXR$),
        map((inputSource) => this.findIntersectingMesh(inputSource)),
        filter((mesh) => mesh !== null)
      )
      .subscribe((mesh) => {
        this.context.signalHub.movement.emit(`${hand}_grip_mesh`, mesh);
      });
  }

  findIntersectingMesh(
    inputSource: BABYLON.WebXRInputSource
  ): BABYLON.AbstractMesh {
    const origin = inputSource.grip.position;
    const ray = new BABYLON.Ray(origin, inputSource.grip.forward, 2);

    const rayHelper = new BABYLON.RayHelper(ray);
    rayHelper.show(this.context.scene, BABYLON.Color3.Red());
    return;
  }
}
