import { context } from "../../context";
import type * as BABYLON from "babylonjs";
import type { ISystem } from "./system";
import { FreeCameraKeyboardWalkInput } from "../../scene/camera-inputs/free-camera-keyboard-walk-input";
import { signalHub } from "../../signalHub";

export class SystemInline implements ISystem {
  name = "inline";
  observer: BABYLON.Observer<BABYLON.Camera>;
  camera: BABYLON.FreeCamera;
  init() {
    const scene: BABYLON.Scene = context.scene;
    this.camera = <BABYLON.FreeCamera>scene.activeCamera;
    this.enhanceCamera();
  }
  enhanceCamera() {
    this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    this.camera.inputs.add(new FreeCameraKeyboardWalkInput());
    this.camera.inertia = 0.2;
    this.camera.angularSensibility = 250;
    this.camera.minZ = 0.05;
    this.observer = this.camera.onViewMatrixChangedObservable.add((cam) => {
      signalHub.movement.emit("camera_moved", {
        pos: cam.position.asArray(),
        rot: cam.absoluteRotation.asArray(),
      });
    });
  }

  dispose() {
    this.camera.inputs.removeByType("FreeCameraKeyboardWalkInput");
    this.camera.onViewMatrixChangedObservable.remove(this.observer);
  }
}
