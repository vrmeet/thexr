import { filter } from "rxjs";
import type { Context } from "../../context";
import { FreeCameraKeyboardFlyingInput } from "../../scene/camera-inputs/free-camera-keyboard-flying-input";
import { FreeCameraKeyboardWalkInput } from "../../scene/camera-inputs/free-camera-keyboard-walk-input";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";
import { arrayReduceSigFigs } from "../../utils/misc";
/**
 * Inline mode means 2D, not immersive playing
 * navigation using cursor or WASD keys
 */

const keyCodeForSmallF = 70;

export class SystemInline implements ISystem {
  flying = false;
  name = "inline";
  public order = 2;
  observerCamera: BABYLON.Observer<BABYLON.Camera>;
  observerKeyboard: BABYLON.Observer<BABYLON.KeyboardInfo>;
  camera: BABYLON.FreeCamera;
  scene: BABYLON.Scene;
  context: Context;
  rightHandHolding: BABYLON.AbstractMesh;
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

    this.context.signalHub.local.on("mesh_picked").subscribe((mesh) => {
      if (
        this.context.state[mesh.name] !== undefined &&
        this.context.state[mesh.name].grabbable !== undefined
      ) {
        if (!this.rightHandHolding) {
          this.inlineGrab(mesh);
        } else {
          this.inlineDrop(mesh);
        }
      }
    });
    this.context.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR))
      .subscribe(() => {
        // show block hands next to face
        // this.createInlineHands();
        // this.bindInlineEvents();
      });

    this.context.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.ENTERING_XR))
      .subscribe(() => {
        // can hide own hands because we have controllers
        // this.unbindInlineEvents();
      });
  }
  inlineDrop(mesh: BABYLON.AbstractMesh) {
    const rightHand = this.scene.getMeshByName(
      `${this.context.my_member_id}_avatar_right`
    );
    const transform = {
      position: arrayReduceSigFigs(rightHand.absolutePosition.asArray()),
      rotation: arrayReduceSigFigs(
        rightHand.absoluteRotationQuaternion.toEulerAngles().asArray()
      ),
      parent: null,
    };
    this.context.signalHub.outgoing.emit("components_upserted", {
      id: mesh.name,
      components: {
        grabbable: { grabbed_by: null },
        transform: transform,
      },
    });
    this.rightHandHolding = null;
  }

  inlineGrab(mesh: BABYLON.AbstractMesh) {
    console.log("can grab this");
    // tell everyone you grabbed it
    const rightHand = this.scene.getMeshByName(
      `${this.context.my_member_id}_avatar_right`
    );
    const transform = {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      parent: rightHand.name,
    };

    this.context.signalHub.outgoing.emit("components_upserted", {
      id: mesh.name,
      components: {
        grabbable: { grabbed_by: this.context.my_member_id },
        transform: transform,
      },
    });
    this.rightHandHolding = mesh;
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
            data.event.keyCode === keyCodeForSmallF &&
            data.type === BABYLON.KeyboardEventTypes.KEYUP
        )
      )
      .subscribe(() => {
        if (this.flying === false) {
          this.camera.inputs.removeByType("FreeCameraKeyboardWalkInput");
          this.camera.inputs.add(new FreeCameraKeyboardFlyingInput());
          this.context.signalHub.incoming.emit("msg", {
            system: "hud",
            data: { msg: "fly mode on" },
          });
        } else {
          this.camera.inputs.removeByType("FreeCameraKeyboardFlyingInput");
          this.camera.inputs.add(new FreeCameraKeyboardWalkInput());
          this.context.signalHub.incoming.emit("msg", {
            system: "hud",
            data: { msg: "fly mode off" },
          });
        }
        this.flying = !this.flying;
      });
  }
}
