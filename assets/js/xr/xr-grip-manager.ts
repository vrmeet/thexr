
import * as BABYLON from "babylonjs"
import { race, Subscription } from "rxjs";
import { filter, map, distinctUntilChanged, tap, take, raceWith, takeUntil, throttleTime } from "rxjs/operators";

import { signalHub } from "../signalHub";
import type { event } from "../types"
import * as utils from "../utils"
import { EventName } from "../event-names";
import { findAvatarHand, findOrCreateAvatarHand } from "../scene/avatar-utils";

const exitingXR$ = signalHub.local.on("xr_state_changed").pipe(
    filter(msg => msg === BABYLON.WebXRState.EXITING_XR)
)

export class XRGripManager {
    public hand: "left" | "right"
    public other_hand: "left" | "right"
    public palmMesh: BABYLON.AbstractMesh
    public intersectedMesh: BABYLON.AbstractMesh
    public intersectedMeshTags: string[]

    constructor(public member_id: string, public scene: BABYLON.Scene,
        public inputSource: BABYLON.WebXRInputSource,
        public motionController: BABYLON.WebXRAbstractMotionController,
        public imposter: BABYLON.PhysicsImpostor,
        callback: (inputSource: BABYLON.WebXRInputSource) => Subscription) {
        this.hand = motionController.handedness as "left" | "right"
        this.other_hand = (this.hand === "left") ? "right" : "left"

        motionController.onModelLoadedObservable.add(model => {
            this.palmMesh = findAvatarHand(this.member_id, this.hand, this.scene)
            this.palmMesh.parent = null

            this.palmMesh.showBoundingBox = true
            let subscription = callback(inputSource)
            this.palmMesh.onDisposeObservable.add(() => {
                subscription.unsubscribe()
            })
            this.palmMesh.visibility = 0.5
            this.palmMesh.position = (this.hand[0] === "l") ? new BABYLON.Vector3(0.03, -0.05, 0.0) : new BABYLON.Vector3(-0.03, -0.05, 0.0)
            this.palmMesh.rotation.x = BABYLON.Angle.FromDegrees(45).radians()
            this.palmMesh.parent = inputSource.grip

            // listen for clean grip and release

            signalHub.movement.on(`${this.hand}_squeeze`).pipe(
                takeUntil(exitingXR$),
                map(val => val.pressed),
                distinctUntilChanged()
            ).subscribe(squeezed => {
                if (squeezed) {
                    signalHub.movement.emit(`${this.hand}_grip_squeezed`, true)
                } else {
                    signalHub.movement.emit(`${this.hand}_grip_released`, true)
                }
            })

            signalHub.movement.on(`${this.hand}_trigger`).pipe(
                takeUntil(exitingXR$),
                map(val => val.pressed),
                distinctUntilChanged()
            ).subscribe(squeezed => {
                if (squeezed) {
                    signalHub.movement.emit(`${this.hand}_trigger_squeezed`, true)
                } else {
                    signalHub.movement.emit(`${this.hand}_trigger_released`, true)
                }
            })

            signalHub.movement.on(`${this.hand}_grip_squeezed`).pipe(
                takeUntil(exitingXR$),
                map(() => (this.findIntersectingMesh())),
                filter(mesh => (mesh !== null))
            ).subscribe(mesh => {
                signalHub.movement.emit(`${this.hand}_grip_mesh`, mesh)
            })



            signalHub.movement.on(`${this.hand}_grip_mesh`).pipe(
                takeUntil(exitingXR$),
                tap((mesh: BABYLON.AbstractMesh) => {
                    this.intersectedMesh = mesh;
                    this.intersectedMeshTags = BABYLON.Tags.GetTags(mesh)
                }),
                tap((mesh) => {
                    let event: event = {
                        m: EventName.entity_grabbed,
                        p: this.createEventPayload()
                    }

                    signalHub.outgoing.emit("event", event)
                    signalHub.incoming.emit("event", event)

                    if (this.intersectedMeshTags.includes("shootable")) {
                        this.shootable().subscribe()
                    } else {
                        this.basicInteractable().subscribe()
                    }

                })
            ).subscribe()

            // in-form menu manager that the controller is ready to bind a menu
            const payload = {
                hand: motionController.handedness
            }
            signalHub.local.emit('controller_ready', payload)


        })


    }

    shootable() {
        return signalHub.movement.on(`${this.hand}_trigger_squeezed`).pipe(
            takeUntil(exitingXR$),
            throttleTime(50),
            tap(() => {
                let event: event = {
                    m: EventName.entity_trigger_squeezed,
                    p: {
                        member_id: this.member_id,
                        entity_id: this.intersectedMesh.id,
                        pos: this.inputSource.pointer.absolutePosition.asArray(),
                        direction: this.inputSource.pointer.forward.asArray()
                    }
                }

                signalHub.outgoing.emit("event", event)
                signalHub.incoming.emit("event", event)
            }),
            takeUntil(this.basicInteractable())
        )
    }

    basicInteractable() {

        return race(
            // if other hand grabbed the same mesh away from the first hand
            signalHub.movement.on(`${this.other_hand}_grip_mesh`).pipe(
                filter(mesh => (mesh.id === this.intersectedMesh.id))
            ),
            // another player stole our object
            signalHub.incoming.on("event").pipe(
                filter(msg => (msg.m === EventName.entity_grabbed && msg.p.entity_id === this.intersectedMesh.id && msg.p.member_id != this.member_id)),
                tap(() => { console.log("other player steal") })
            ),

            // or the first hand released the mesh
            signalHub.movement.on(`${this.hand}_grip_released`).pipe(
                tap(() => {
                    let event: event = {
                        m: EventName.entity_released,
                        p: this.createEventPayload()
                    }
                    if (this.intersectedMeshTags.includes("physics")) {
                        event.p.lv = utils.arrayReduceSigFigs(this.imposter.getLinearVelocity().asArray())
                        event.p.av = utils.arrayReduceSigFigs(this.imposter.getAngularVelocity().asArray())
                    }
                    signalHub.outgoing.emit("event", event)
                    signalHub.incoming.emit("event", event)
                })

            )
        ).pipe(
            tap(() => {
                this.intersectedMesh = null
                this.intersectedMeshTags = []
            }),
            take(1)
        )

    }

    createEventPayload() {

        let payload = {
            member_id: this.member_id,
            entity_id: this.intersectedMesh.id,
            hand_pos_rot: {
                pos: utils.arrayReduceSigFigs(this.palmMesh.absolutePosition.asArray()),
                rot: utils.arrayReduceSigFigs(this.palmMesh.absoluteRotationQuaternion.asArray())
            },
            entity_pos_rot: {
                pos: utils.arrayReduceSigFigs(this.intersectedMesh.absolutePosition.asArray()),
                rot: utils.arrayReduceSigFigs(this.intersectedMesh.absoluteRotationQuaternion.asArray())
            },
            hand: this.hand
        }
        return payload
    }

    findIntersectingMesh(): BABYLON.AbstractMesh {
        const meshes = this.scene.getMeshesByTags("interactable")
        for (let i = 0; i < meshes.length; i++) {
            if (meshes[i].intersectsMesh(this.palmMesh)) {
                return meshes[i]
            }
        }
        return null
    }
}