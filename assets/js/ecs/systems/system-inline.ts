import { context } from "../../context";
import type * as BABYLON from "babylonjs";
import type { ISystem } from "./system";
import { FreeCameraKeyboardWalkInput } from "../../scene/camera-inputs/free-camera-keyboard-walk-input";
import { signalHub } from "../../signalHub";
/**
 * Inline mode means 2D, not immersive playing
 * navigation using cursor or WASD keys
 */
export class SystemInline implements ISystem {
  name = "inline";
  observerCamera: BABYLON.Observer<BABYLON.Camera>;
  observerKeyboard: BABYLON.Observer<BABYLON.KeyboardInfo>;
  camera: BABYLON.FreeCamera;
  scene: BABYLON.Scene;
  init() {
    this.scene = context.scene;
    this.scene.collisionsEnabled = true;
    this.camera = <BABYLON.FreeCamera>this.scene.activeCamera;
    this.enhanceCamera();
    this.observerKeyboard = this.scene.onKeyboardObservable.add(
      (keyboardInfo) => {
        signalHub.local.emit("keyboard_info", keyboardInfo);
      }
    );
  }
  enhanceCamera() {
    this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    this.camera.inputs.add(new FreeCameraKeyboardWalkInput());
    this.camera.inertia = 0.2;
    this.camera.angularSensibility = 250;
    this.camera.minZ = 0.05;
    this.observerCamera = this.camera.onViewMatrixChangedObservable.add(
      (cam) => {
        signalHub.movement.emit("camera_moved", {
          pos: cam.position.asArray(),
          rot: cam.absoluteRotation.asArray(),
        });
      }
    );
  }

  dispose() {
    this.camera.inputs.removeByType("FreeCameraKeyboardWalkInput");
    this.camera.onViewMatrixChangedObservable.remove(this.observerCamera);
    this.scene.onKeyboardObservable.remove(this.observerKeyboard);
  }
}
