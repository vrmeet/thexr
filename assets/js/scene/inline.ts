import { filter } from "rxjs/operators";
import { EventName } from "../event-names";
import { signalHub } from "../signalHub";
import { arrayReduceSigFigs } from "../utils";
import { Avatar } from "./avatar";
import * as BABYLON from "babylonjs"
import type { event } from "../types"

export class Inline {
    public heldMesh: BABYLON.AbstractMesh
    constructor(public member_id: string, public scene: BABYLON.Scene) {
        this.heldMesh = null

        signalHub.local.on("client_ready").subscribe(() => {

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

    emitTriggerSqueezed() {
        const rightHand = Avatar.findAvatarHand(this.member_id, "right", this.scene)
        const head = this.scene.activeCamera as BABYLON.FreeCamera
        const direction = BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.Forward(), head.getWorldMatrix())
        let event: event = {
            m: EventName.entity_trigger_squeezed,
            p: {
                member_id: this.member_id,
                entity_id: this.heldMesh.id,
                pos: arrayReduceSigFigs(rightHand.absolutePosition.asArray()),
                direction: direction.asArray()
            }
        }

        signalHub.outgoing.emit("event", event)
        signalHub.incoming.emit("event", event)
    }

    emitReleased(mesh: BABYLON.AbstractMesh) {
        const rightHand = Avatar.findAvatarHand(this.member_id, "right", this.scene)
        let payload = {
            member_id: this.member_id,
            entity_id: mesh.id,
            hand_pos_rot: {
                pos: arrayReduceSigFigs(rightHand.absolutePosition.asArray()),
                rot: arrayReduceSigFigs(rightHand.absoluteRotationQuaternion.asArray())
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
        const rightHand = Avatar.findAvatarHand(this.member_id, "right", this.scene)
        let payload = {
            member_id: this.member_id,
            entity_id: mesh.id,
            hand_pos_rot: {
                pos: arrayReduceSigFigs(rightHand.absolutePosition.asArray()),
                rot: arrayReduceSigFigs(rightHand.absoluteRotationQuaternion.asArray())
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