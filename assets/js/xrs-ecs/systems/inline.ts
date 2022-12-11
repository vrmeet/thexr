import type { Context } from "../context";
import type { ISystem } from "../system";
import type { XRS } from "../xrs";
import * as BABYLON from "babylonjs";
import { filter, map, Subscription, tap } from "rxjs";
import { FreeCameraKeyboardFlyingInput } from "../../scene/camera-inputs/free-camera-keyboard-flying-input";
import { FreeCameraKeyboardWalkInput } from "../../scene/camera-inputs/free-camera-keyboard-walk-input";
import { arrayReduceSigFigs } from "../../utils/misc";
import { Entity } from "../entity";

/**
 * Inline mode means 2D, not immersive playing
 * navigation using cursor or WASD keys
 */

const keyCodeForSmallF = 70;

export class SystemInline implements ISystem {
  flying = false;
  name = "inline";
  observerCamera: BABYLON.Observer<BABYLON.Camera>;
  observerKeyboard: BABYLON.Observer<BABYLON.KeyboardInfo>;
  camera: BABYLON.FreeCamera;
  scene: BABYLON.Scene;
  context: Context;
  holdingEntity: Entity;
  subscriptions: Subscription[] = [];
  rightHandMesh: BABYLON.AbstractMesh;
  public xrs: XRS;
  setup(xrs: XRS): void {
    this.xrs = xrs;
    this.context = this.xrs.context;
    this.scene = this.context.scene;
    this.scene.collisionsEnabled = true;
    this.camera = <BABYLON.FreeCamera>this.scene.activeCamera;
    this.enhanceCamera();
    this.observerKeyboard = this.scene.onKeyboardObservable.add(
      (keyboardInfo) => {
        this.context.signalHub.local.emit("keyboard_info", keyboardInfo);
      }
    );
    this.bindInlineEvents();
    this.context.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR))
      .subscribe(() => {
        // show block hands next to face
        // this.createInlineHands();
        this.bindInlineEvents();
      });

    this.context.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.ENTERING_XR))
      .subscribe(() => {
        // can hide own hands because we have controllers
        this.unbindInlineEvents();
      });

    this.listenForTriggerSubstitute();
  }

  listenForTriggerSubstitute() {
    this.context.signalHub.local.on("trigger_substitute").subscribe(() => {
      if (
        this.holdingEntity &&
        this.holdingEntity.hasComponent("triggerable")
      ) {
        this.context.signalHub.movement.emit("trigger_holding_mesh", {
          hand: "right",
          mesh: this.rightHandMesh.getChildMeshes()[0],
        });
      }
      // if (this.heldMesh()) {
      //   this.emitTriggerSqueezed();
      // }
    });
  }

  bindInlineEvents() {
    this.subscriptions.push(this.bindFKeyForFlight());
    this.subscriptions.push(this.bindDoubleClickToGrab());
    this.subscriptions.push(this.bindKeyboardForTrigger());
  }

  unbindInlineEvents() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.length = 0;
  }

  getRightHandMesh() {
    if (!this.rightHandMesh) {
      this.rightHandMesh = this.scene.getMeshByName(
        `${this.context.my_member_id}_avatar_right`
      );
    }
    return this.rightHandMesh;
  }

  inlineDrop() {
    const rightHand = this.getRightHandMesh();
    const transform = {
      position: arrayReduceSigFigs(rightHand.absolutePosition.asArray()),
      rotation: arrayReduceSigFigs(
        rightHand.absoluteRotationQuaternion.toEulerAngles().asArray()
      ),
      parent: null,
    };
    this.context.signalHub.outgoing.emit("components_upserted", {
      id: this.holdingEntity.name,
      components: {
        transform: transform,
      },
    });
    this.holdingEntity = null;
  }

  inlineGrab(entity: Entity) {
    const rightHand = this.getRightHandMesh();
    const transform = {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      parent: rightHand.name,
    };

    this.context.signalHub.outgoing.emit("components_upserted", {
      id: entity.name,
      components: {
        transform: transform,
      },
    });
    this.holdingEntity = entity;
  }

  enhanceCamera() {
    this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    this.camera.inputs.add(new FreeCameraKeyboardWalkInput());
    this.camera.inertia = 0.2;
    this.camera.angularSensibility = 250;
    this.camera.minZ = 0.05;
  }
  bindDoubleClickToGrab() {
    return this.context.signalHub.local
      .on("pointer_info")
      .pipe(
        filter(
          (info) => info.type === BABYLON.PointerEventTypes.POINTERDOUBLETAP
        ),
        map((info) => info.pickInfo.pickedMesh),
        filter((mesh) => mesh !== null),
        map((mesh) => this.xrs.getEntity(mesh.name)),
        filter((entity) => entity !== null),
        filter((entity) => entity.hasComponent("holdable"))
      )
      .subscribe((entity) => {
        if (!this.holdingEntity) {
          this.inlineGrab(entity);
        } else {
          if (entity.name === this.holdingEntity.name) {
            this.inlineDrop();
          } else {
            // swap
            this.inlineDrop();
            this.inlineGrab(entity);
          }
        }
      });
  }

  bindKeyboardForTrigger() {
    // when space bar pressed
    return this.context.signalHub.local
      .on("keyboard_info")
      .pipe(
        filter(
          (info) =>
            info.type === BABYLON.KeyboardEventTypes.KEYDOWN &&
            info.event.keyCode === 32
        )
      )
      .subscribe(() => {
        this.context.signalHub.local.emit("trigger_substitute", true);
      });
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
