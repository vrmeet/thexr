import { filter } from "rxjs/operators";
import { EventName } from "../event-names";
import { signalHub } from "../signalHub";
import { arrayReduceSigFigs, unsetPosRot } from "../utils";
import { Avatar } from "./avatar";
import * as BABYLON from "babylonjs"
import type { event } from "../types"
import { FreeCameraKeyboardFlyingInput } from "./camera-inputs/free-camera-keyboard-flying-input";
import { FreeCameraKeyboardWalkInput } from "./camera-inputs/free-camera-keyboard-walk-input";

export class Inline {
    public heldMesh: BABYLON.AbstractMesh
    public rightHandMesh: BABYLON.AbstractMesh
    public flying: boolean
    constructor(public member_id: string, public scene: BABYLON.Scene, public camera: BABYLON.FreeCamera) {
        this.heldMesh = null
        this.rightHandMesh = null
        this.flying = false

        // Attach the camera to the canvas
        this.camera.attachControl(this.scene.getEngine()._workingCanvas, false);
        this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput")
        this.camera.inputs.add(new FreeCameraKeyboardWalkInput())
        this.camera.inertia = 0.2;
        this.camera.angularSensibility = 250;
        this.camera.minZ = 0.05
        this.camera.onViewMatrixChangedObservable.add(cam => {
            signalHub.movement.emit("camera_moved", { pos: cam.position.asArray(), rot: cam.absoluteRotation.asArray() })
        })



        this.createInlineHands()

        signalHub.local.on("xr_state_changed").pipe(
            filter(msg => msg === BABYLON.WebXRState.EXITING_XR)
        ).subscribe(() => {
            this.createInlineHands()
        })

        signalHub.local.on("client_ready").subscribe(() => {

            this.bindFKeyForFlight()

            // another player stole our object
            signalHub.incoming.on("event").pipe(
                filter(msg => (msg.m === EventName.entity_grabbed && this.heldMesh !== null && msg.p.entity_id === this.heldMesh.id && msg.p.member_id != this.member_id)),
            ).subscribe(() => {
                this.heldMesh = null
            })


            signalHub.local.on("keyboard_info").pipe(
                filter(info => (info.type === BABYLON.KeyboardEventTypes.KEYDOWN && info.event.keyCode === 32))
            ).subscribe(() => {
                if (this.heldMesh) {
                    this.emitTriggerSqueezed()
                }

            })
            // see if grabbing a gun in 2D
            signalHub.local.on("pointer_info").pipe(
                filter(info => info.type === BABYLON.PointerEventTypes.POINTERPICK)
            ).subscribe(info => {

                let mesh = info.pickInfo.pickedMesh
                if (mesh && BABYLON.Tags.MatchesQuery(mesh, "shootable")) {
                    if (this.heldMesh === null) {
                        this.emitGrabbed(mesh)
                        this.heldMesh = mesh
                    } else {
                        // let go,
                        this.emitReleased(mesh)
                        this.heldMesh = null
                    }
                }

            })


        })
    }

    createInlineHands() {

        let left = Avatar.findOrCreateAvatarHand(this.member_id, "left", this.scene)
        left.parent = this.camera
        unsetPosRot(left)
        left.position.copyFromFloats(-0.2, 0, 0.2)
        left.visibility = 0.2

        let right = Avatar.findOrCreateAvatarHand(this.member_id, "right", this.scene)
        right.parent = this.camera
        unsetPosRot(right)
        right.position.copyFromFloats(0.2, 0, 0.2)
        right.visibility = 0.2

    }

    bindFKeyForFlight() {

        signalHub.local.on("keyboard_info").pipe(
            filter(data => (data.event.keyCode === 70 && data.type === BABYLON.KeyboardEventTypes.KEYUP))
        ).subscribe(data => {
            if (this.flying === false) {
                this.camera.inputs.removeByType("FreeCameraKeyboardWalkInput")
                this.camera.inputs.add(new FreeCameraKeyboardFlyingInput())
            } else {
                this.camera.inputs.removeByType("FreeCameraKeyboardFlyingInput");
                this.camera.inputs.add(new FreeCameraKeyboardWalkInput())
            }
            this.flying = !this.flying
        })
    }

    emitTriggerSqueezed() {
        if (!this.rightHandMesh) {
            this.rightHandMesh = Avatar.findAvatarHand(this.member_id, "right", this.scene)
        }
        const direction = this.rightHandMesh.getDirection(BABYLON.Vector3.Forward())

        let event: event = {
            m: EventName.entity_trigger_squeezed,
            p: {
                member_id: this.member_id,
                entity_id: this.heldMesh.id,
                pos: arrayReduceSigFigs(this.rightHandMesh.absolutePosition.asArray()),
                direction: direction.asArray()
            }
        }

        signalHub.outgoing.emit("event", event)
        signalHub.incoming.emit("event", event)
    }

    emitReleased(mesh: BABYLON.AbstractMesh) {
        if (!this.rightHandMesh) {
            this.rightHandMesh = Avatar.findAvatarHand(this.member_id, "right", this.scene)
        }
        let payload = {
            member_id: this.member_id,
            entity_id: mesh.id,
            hand_pos_rot: {
                pos: arrayReduceSigFigs(this.rightHandMesh.absolutePosition.asArray()),
                rot: arrayReduceSigFigs(this.rightHandMesh.absoluteRotationQuaternion.asArray())
            },
            entity_pos_rot: {
                pos: arrayReduceSigFigs(mesh.absolutePosition.asArray()),
                rot: arrayReduceSigFigs(mesh.absoluteRotationQuaternion.asArray())
            },
            hand: "right"
        }
        signalHub.outgoing.emit("event", { m: EventName.entity_released, p: payload })
        signalHub.incoming.emit("event", { m: EventName.entity_released, p: payload })


    }

    emitGrabbed(mesh: BABYLON.AbstractMesh) {
        if (!this.rightHandMesh) {
            this.rightHandMesh = Avatar.findAvatarHand(this.member_id, "right", this.scene)
        }
        let payload = {
            member_id: this.member_id,
            entity_id: mesh.id,
            hand_pos_rot: {
                pos: arrayReduceSigFigs(this.rightHandMesh.absolutePosition.asArray()),
                rot: arrayReduceSigFigs(this.rightHandMesh.absoluteRotationQuaternion.asArray())
            },
            entity_pos_rot: {
                pos: arrayReduceSigFigs(mesh.absolutePosition.asArray()),
                rot: arrayReduceSigFigs(mesh.absoluteRotationQuaternion.asArray())
            },
            hand: "right"
        }
        signalHub.outgoing.emit("event", { m: EventName.entity_grabbed, p: payload })
        signalHub.incoming.emit("event", { m: EventName.entity_grabbed, p: payload })


    }
}