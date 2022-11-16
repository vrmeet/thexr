import { filter, single } from "rxjs/operators";
import { EventName } from "../event-names";
import { signalHub } from "../signalHub";
import { Avatar } from "./avatar";
import * as BABYLON from "babylonjs";
import { FreeCameraKeyboardFlyingInput } from "./camera-inputs/free-camera-keyboard-flying-input";
import { FreeCameraKeyboardWalkInput } from "./camera-inputs/free-camera-keyboard-walk-input";
import type { Subscription } from "rxjs";
import { mode } from "../mode";
import { arrayReduceSigFigs, unsetPosRot } from "../utils/misc";

export class Inline {
  // public heldMesh: BABYLON.AbstractMesh
  public rightHandMesh: BABYLON.AbstractMesh;
  public flying: boolean;

  public subscriptions: Subscription[];
  constructor(
    public member_id: string,
    public scene: BABYLON.Scene,
    public camera: BABYLON.FreeCamera
  ) {
    this.flying = false;
    this.subscriptions = [];

    // Attach the camera to the canvas
    this.camera.attachControl(this.scene.getEngine()._workingCanvas, false);
    this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    this.camera.inputs.add(new FreeCameraKeyboardWalkInput());
    this.camera.inertia = 0.2;
    this.camera.angularSensibility = 250;
    this.camera.minZ = 0.05;
    this.camera.onViewMatrixChangedObservable.add(cam => {
      signalHub.movement.emit("camera_moved", {
        pos: cam.position.asArray(),
        rot: cam.absoluteRotation.asArray(),
      });
    });

    this.bindFKeyForFlight();

    this.createInlineHands();

    signalHub.local
      .on("xr_state_changed")
      .pipe(filter(msg => msg === BABYLON.WebXRState.EXITING_XR))
      .subscribe(() => {
        this.createInlineHands();
        this.bindInlineEvents();
      });

    signalHub.local
      .on("xr_state_changed")
      .pipe(filter(msg => msg === BABYLON.WebXRState.ENTERING_XR))
      .subscribe(() => {
        this.unbindInlineEvents();
      });

    // signalHub.local.on("client_ready").subscribe(() => {

    //     this.bindInlineEvents()

    // })

    signalHub.menu.on("menu_opened").subscribe(value => {
      if (value) {
        this.unbindInlineEvents();
      } else {
        this.bindInlineEvents();
      }
    });
  }

  unbindInlineEvents() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
    this.subscriptions = [];
  }

  heldMesh() {
    if (!this.rightHandMesh) {
      return null;
    }
    let childMeshes = this.rightHandMesh.getChildMeshes(true);
    if (childMeshes.length > 0) {
      return childMeshes[0];
    } else {
      return null;
    }
  }

  bindInlineEvents() {
    // // another player stole our object
    // let a = signalHub.incoming.on("event").pipe(
    //     filter(msg => (msg.m === EventName.entity_grabbed && this.heldMesh() !== null && msg.p.entity_id === this.heldMesh.id && msg.p.member_id != this.member_id)),
    // ).subscribe(() => {
    //     this.heldMesh = null
    // })
    // this.subscriptions.push(a)

    // when space bar pressed
    let b = signalHub.local
      .on("keyboard_info")
      .pipe(
        filter(
          info =>
            info.type === BABYLON.KeyboardEventTypes.KEYDOWN &&
            info.event.keyCode === 32
        )
      )
      .subscribe(() => {
        signalHub.local.emit("trigger_substitute", true);
      });
    this.subscriptions.push(b);

    let c = signalHub.local.on("trigger_substitute").subscribe(() => {
      if (this.heldMesh()) {
        this.emitTriggerSqueezed();
      }
    });
    this.subscriptions.push(c);

    let d = signalHub.local
      .on("pointer_info")
      .pipe(filter(info => info.type === BABYLON.PointerEventTypes.POINTERPICK))
      .subscribe(info => {
        // don't pick anything up in inline if you're editing
        if (mode.menu_open) {
          return;
        }
        let mesh = info.pickInfo.pickedMesh;
        if (mesh) {
          if (BABYLON.Tags.MatchesQuery(mesh, "collectable")) {
            if (mesh.getDistanceToCamera(this.scene.activeCamera) <= 2) {
              signalHub.local.emit("collect_substitute", {
                entity_id: mesh.id,
              });
            }
          } else if (
            BABYLON.Tags.MatchesQuery(mesh, "shootable || interactable")
          ) {
            if (this.heldMesh() === null) {
              this.emitGrabbedmenu_bar: HTMLElement, menu_home: HTMLElement | nulys(mesh);
              // this.heldMesh = mesh
            } else {
              // let go,
              this.emitReleased(mesh);
              //  this.heldMesh = null
            }
          }
        }
      });
    this.subscriptions.push(d);
  }

  createInlineHands() {
    let left = Avatar.findOrCreateAvatarHand(
      this.member_id,
      "left",
      this.scene
    );
    left.parent = this.camera;
    unsetPosRot(left);
    left.position.copyFromFloats(-0.2, 0, 0.2);
    left.visibility = 0.2;

    let right = Avatar.findOrCreateAvatarHand(
      this.member_id,
      "right",
      this.scene
    );
    right.parent = this.camera;
    unsetPosRot(right);
    right.position.copyFromFloats(0.2, 0, 0.2);
    right.visibility = 0.2;

    this.rightHandMesh = right;
  }

  bindFKeyForFlight() {
    return signalHub.local
      .on("keyboard_info")
      .pipe(
        filter(
          data =>
            data.event.keyCode === 70 &&
            data.type === BABYLON.KeyboardEventTypes.KEYUP
        )
      )
      .subscribe(data => {
        console.log("got here");
        if (this.flying === false) {
          this.camera.inputs.removeByType("FreeCameraKeyboardWalkInput");
          this.camera.inputs.add(new FreeCameraKeyboardFlyingInput());
          console.log("fly mode on");
          signalHub.incoming.emit("hud_msg", "Flying mode ON");
        } else {
          this.camera.inputs.removeByType("FreeCameraKeyboardFlyingInput");
          this.camera.inputs.add(new FreeCameraKeyboardWalkInput());
          signalHub.incoming.emit("hud_msg", "fly mode off");
          console.log("fly mode off");
        }
        this.flying = !this.flying;
      });
  }

  emitTriggerSqueezed() {
    // if (!this.rightHandMesh) {
    //     this.rightHandMesh = Avatar.findAvatarHand(this.member_id, "right", this.scene)
    // }
    const direction = this.rightHandMesh.getDirection(
      BABYLON.Vector3.Forward()
    );
    signalHub.local.emit("trigger_squeezed_with_entity", {
      entity_id: this.heldMesh().id,
      pos: arrayReduceSigFigs(this.rightHandMesh.absolutePosition.asArray()),
      direction: direction.asArray(),
    });
    // let event: event = {
    //     m: EventName.entity_trigger_squeezed,
    //     p: {
    //         member_id: this.member_id,
    //         entity_id: this.heldMesh.id,
    //         pos: arrayReduceSigFigs(this.rightHandMesh.absolutePosition.asArray()),
    //         direction: direction.asArray()
    //     }
    // }

    // signalHub.outgoing.emit("event", event)
    // signalHub.incoming.emit("event", event)
  }

  emitReleased(mesh: BABYLON.AbstractMesh) {
    // if (!this.rightHandMesh) {
    //     this.rightHandMesh = Avatar.findAvatarHand(this.member_id, "right", this.scene)
    // }
    let payload = {
      member_id: this.member_id,
      entity_id: mesh.id,
      hand_pos_rot: {
        pos: arrayReduceSigFigs(this.rightHandMesh.absolutePosition.asArray()),
        rot: arrayReduceSigFigs(
          this.rightHandMesh.absoluteRotationQuaternion.asArray()
        ),
      },
      entity_pos_rot: {
        pos: arrayReduceSigFigs(mesh.absolutePosition.asArray()),
        rot: arrayReduceSigFigs(mesh.absoluteRotationQuaternion.asArray()),
      },
      hand: "right",
    };
    signalHub.outgoing.emit("event", {
      m: EventName.entity_released,
      p: payload,
    });
    signalHub.incoming.emit("event", {
      m: EventName.entity_released,
      p: payload,
    });
  }

  emitGrabbed(mesh: BABYLON.AbstractMesh) {
    // if (!this.rightHandMesh) {
    //     this.rightHandMesh = Avatar.findAvatarHand(this.member_id, "right", this.scene)
    // }
    let payload = {
      member_id: this.member_id,
      entity_id: mesh.id,
      hand_pos_rot: {
        pos: arrayReduceSigFigs(this.rightHandMesh.absolutePosition.asArray()),
        rot: arrayReduceSigFigs(
          this.rightHandMesh.absoluteRotationQuaternion.asArray()
        ),
      },
      entity_pos_rot: {
        pos: arrayReduceSigFigs(mesh.absolutePosition.asArray()),
        rot: arrayReduceSigFigs(mesh.absoluteRotationQuaternion.asArray()),
      },
      hand: "right",
    };
    signalHub.outgoing.emit("event", {
      m: EventName.entity_grabbed,
      p: payload,
    });
    signalHub.incoming.emit("event", {
      m: EventName.entity_grabbed,
      p: payload,
    });
  }
}
