import { filter } from "rxjs/operators";
import { EventName } from "../event-names";
import { signalHub } from "../signalHub";
import { arrayReduceSigFigs } from "../utils";
import { Avatar } from "./avatar";
import * as BABYLON from "babylonjs"
import type { event } from "../types"

export class Inline {
    public heldMesh: BABYLON.AbstractMesh
    public rightHandMesh: BABYLON.AbstractMesh
    public direction: BABYLON.Vector3
    constructor(public member_id: string, public scene: BABYLON.Scene) {
        this.heldMesh = null
        this.rightHandMesh = null

        signalHub.local.on("client_ready").subscribe(() => {

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

    emitTriggerSqueezed() {
        if (!this.rightHandMesh) {
            this.rightHandMesh = Avatar.findAvatarHand(this.member_id, "right", this.scene)
        }
        if (!this.direction) {
            this.direction = this.rightHandMesh.getDirection(BABYLON.Vector3.Forward())
        }

        let event: event = {
            m: EventName.entity_trigger_squeezed,
            p: {
                member_id: this.member_id,
                entity_id: this.heldMesh.id,
                pos: arrayReduceSigFigs(this.rightHandMesh.absolutePosition.asArray()),
                direction: this.direction.asArray()
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