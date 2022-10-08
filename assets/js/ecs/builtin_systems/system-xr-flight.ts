import { filter, takeUntil, map } from "rxjs";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";
import { cameraFrontPosition } from "../../utils/misc";

const NORMAL_DAMPENING_FACTOR = 0.1;
const GO_FASTER_DAMPENING = 0.2;

export class SystemXRFlight implements ISystem {
  public context: Context;
  public name = "system-xr-flight";
  public order = 20;
  public forwardVelocity = 0;
  public sideVelocity = 0;
  public dampeningFactor = NORMAL_DAMPENING_FACTOR; // slows down the speed to prevent nausea
  init(context: Context) {
    this.context = context;
    this.context.signalHub.movement
      .on("left_trigger_squeezed")
      .subscribe(() => {
        this.dampeningFactor = GO_FASTER_DAMPENING;
      });
    this.context.signalHub.movement
      .on("left_trigger_released")
      .subscribe(() => {
        this.dampeningFactor = NORMAL_DAMPENING_FACTOR;
      });

    this.context.signalHub.movement.on("left_axes").subscribe((axes) => {
      const camera = this.context.scene.activeCamera;

      const localDirectionToGoTo = new BABYLON.Vector3(
        axes.x,
        0,
        -axes.y
      ).scaleInPlace(this.dampeningFactor);

      const globalDirectionToGoTo = BABYLON.Vector3.TransformCoordinates(
        localDirectionToGoTo,
        camera.getWorldMatrix()
      );
      // console.log("direction", globalDirectionToGoTo.asArray());
      // .scaleInPlace(this.dampeningFactor);
      // .scaleInPlace(this.dampeningFactor);
      camera.position.copyFrom(globalDirectionToGoTo);
      // const forwardVec = this.camera
      //   .getDirection(BABYLON.Vector3.Forward())
      //   .normalize()
      //   .scaleInPlace(-axes.y / this.dampeningFactor);

      // const sideVec = this.context.scene.activeCamera
      //   .getDirection(BABYLON.Vector3.Right())
      //   .normalize()
      //   .scaleInPlace(axes.x / this.dampeningFactor);

      // const newPosition = this.context.scene.activeCamera.position
      //   .add(forwardVec)
      //   .add(sideVec);

      // this.context.scene.activeCamera.position = newPosition;
    });
  }
}
