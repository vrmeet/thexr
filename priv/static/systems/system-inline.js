import * as BABYLON from "babylonjs";
import { FreeCameraKeyboardWalkInput } from "../../scene/camera-inputs/free-camera-keyboard-walk-input";
import { filter } from "rxjs";
import { FreeCameraKeyboardFlyingInput } from "../../scene/camera-inputs/free-camera-keyboard-flying-input";
export class SystemInline {
  constructor() {
    this.flying = false;
    this.name = "inline";
  }
  init(context) {
    this.context = context;
    this.scene = this.context.scene;
    console.log("the context is", context);
    this.scene.collisionsEnabled = true;
    this.camera = this.scene.activeCamera;
    this.enhanceCamera();
    this.observerKeyboard = this.scene.onKeyboardObservable.add((keyboardInfo) => {
      context.signalHub.local.emit("keyboard_info", keyboardInfo);
    });
    this.bindFKeyForFlight();
  }
  enhanceCamera() {
    this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    this.camera.inputs.add(new FreeCameraKeyboardWalkInput());
    this.camera.inertia = 0.2;
    this.camera.angularSensibility = 250;
    this.camera.minZ = 0.05;
    this.observerCamera = this.camera.onViewMatrixChangedObservable.add((cam) => {
      this.context.signalHub.movement.emit("camera_moved", {
        pos: cam.position.asArray(),
        rot: cam.absoluteRotation.asArray()
      });
    });
  }
  bindFKeyForFlight() {
    return this.context.signalHub.local.on("keyboard_info").pipe(filter((data) => data.event.keyCode === 70 && data.type === BABYLON.KeyboardEventTypes.KEYUP)).subscribe(() => {
      console.log("got here");
      if (this.flying === false) {
        this.camera.inputs.removeByType("FreeCameraKeyboardWalkInput");
        this.camera.inputs.add(new FreeCameraKeyboardFlyingInput());
        console.log("fly mode on");
        this.context.signalHub.incoming.emit("hud_msg", "Flying mode ON");
      } else {
        this.camera.inputs.removeByType("FreeCameraKeyboardFlyingInput");
        this.camera.inputs.add(new FreeCameraKeyboardWalkInput());
        this.context.signalHub.incoming.emit("hud_msg", "fly mode off");
        console.log("fly mode off");
      }
      this.flying = !this.flying;
    });
  }
  dispose() {
    this.camera.inputs.removeByType("FreeCameraKeyboardWalkInput");
    this.camera.onViewMatrixChangedObservable.remove(this.observerCamera);
    this.scene.onKeyboardObservable.remove(this.observerKeyboard);
  }
}
