import { filter } from "rxjs";
import type { Context } from "../context";
import { FreeCameraKeyboardFlyingInput } from "../scene/camera-inputs/free-camera-keyboard-flying-input";
import { FreeCameraKeyboardWalkInput } from "../scene/camera-inputs/free-camera-keyboard-walk-input";
import type { IService } from "./service";
import * as BABYLON from "babylonjs";
/**
 * Inline mode means 2D, not immersive playing
 * navigation using cursor or WASD keys
 */
export class ServiceInline implements IService {
  flying = false;
  name = "service-inline";
  observerCamera: BABYLON.Observer<BABYLON.Camera>;
  observerKeyboard: BABYLON.Observer<BABYLON.KeyboardInfo>;
  camera: BABYLON.FreeCamera;
  scene: BABYLON.Scene;
  context: Context;
  init(context: Context) {
    this.context = context;
    this.scene = this.context.scene;
    this.scene.collisionsEnabled = true;
    this.camera = <BABYLON.FreeCamera>this.scene.activeCamera;
    this.enhanceCamera();
    this.observerKeyboard = this.scene.onKeyboardObservable.add(
      (keyboardInfo) => {
        context.signalHub.local.emit("keyboard_info", keyboardInfo);
      }
    );
    this.bindFKeyForFlight();
  }
  enhanceCamera() {
    this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    this.camera.inputs.add(new FreeCameraKeyboardWalkInput());
    this.camera.inertia = 0.2;
    this.camera.angularSensibility = 250;
    this.camera.minZ = 0.05;
  }

  bindFKeyForFlight() {
    return this.context.signalHub.local
      .on("keyboard_info")
      .pipe(
        filter(
          (data) =>
            data.event.keyCode === 70 &&
            data.type === BABYLON.KeyboardEventTypes.KEYUP
        )
      )
      .subscribe(() => {
        if (this.flying === false) {
          this.camera.inputs.removeByType("FreeCameraKeyboardWalkInput");
          this.camera.inputs.add(new FreeCameraKeyboardFlyingInput());
          this.context.signalHub.incoming.emit("hud_msg", "Flying mode ON");
        } else {
          this.camera.inputs.removeByType("FreeCameraKeyboardFlyingInput");
          this.camera.inputs.add(new FreeCameraKeyboardWalkInput());
          this.context.signalHub.incoming.emit("hud_msg", "fly mode off");
        }
        this.flying = !this.flying;
      });
  }
}
