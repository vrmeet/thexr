
import * as BABYLON from "babylonjs"
import { Observable, of, pipe, race } from "rxjs";
import { switchMap, filter, map, distinctUntilChanged, tap, take, raceWith } from "rxjs/operators";
import type { Orchestrator } from "../orchestrator";
import { signalHub } from "../signalHub";
import type { event } from "../types"
import * as utils from "../utils"

const GRIP = "_trigger" // "_squeeze"

export class XRGripManager {
    public hand: "left" | "right"
    public other_hand: "left" | "right"
    public palmMesh: BABYLON.AbstractMesh
    public intersectedMesh: BABYLON.AbstractMesh
    public scene: BABYLON.Scene

    constructor(public orchestrator: Orchestrator, public inputSource: BABYLON.WebXRInputSource, public motionController: BABYLON.WebXRAbstractMotionController) {
        this.scene = orchestrator.sceneManager.scene
        this.hand = motionController.handedness as "left" | "right"
        this.other_hand = (this.hand === "left") ? "right" : "left"


        motionController.onModelLoadedObservable.add(() => {
            this.palmMesh = BABYLON.MeshBuilder.CreateBox(`avatar_${this.orchestrator.member_id}_${this.hand}`, { size: 0.1 }, this.scene)
            this.palmMesh.showBoundingBox = true
            this.palmMesh.visibility = 0.5
            this.palmMesh.position = (this.hand[0] === "l") ? new BABYLON.Vector3(0.05, -0.05, 0.05) : new BABYLON.Vector3(-0.05, -0.05, 0.05)
            this.palmMesh.parent = inputSource.grip

            // listen for clean grip and release

            signalHub.movement.on(`${this.hand}${GRIP}`).pipe(
                map(val => val.pressed),
                distinctUntilChanged()
            ).subscribe(squeezed => {
                console.log('squeezed', squeezed)
                if (squeezed) {
                    signalHub.movement.emit(`${this.hand}_grip_squeezed`, true)
                } else {
                    signalHub.movement.emit(`${this.hand}_grip_released`, true)
                }
            })

            signalHub.movement.on(`${this.hand}_grip_squeezed`).pipe(
                tap(() => { console.log('got here') }),
                map(() => (this.findIntersectingMesh())),
                filter(mesh => (mesh !== null)),
                tap((mesh: BABYLON.AbstractMesh) => (this.intersectedMesh = mesh)),
                map(mesh => ([mesh, BABYLON.Tags.GetTags(mesh)] as [BABYLON.AbstractMesh, string[]])),
                switchMap(([mesh, tags]) => {
                    // if (tags.includes("gun")) {
                    //
                    // } else {
                    return this.basicInteractable(mesh)
                    //}
                })
            ).subscribe()



            // load xr grip plugins



        })


    }

    basicInteractable(mesh: BABYLON.AbstractMesh) {
        //
        console.log('emit entity_grabbed')

        return race(
            signalHub.movement.on(`${this.other_hand}_grip_squeezed`).pipe(
                map(() => (this.findIntersectingMesh())),
                filter(val => (val !== null && this.intersectedMesh !== null && val.id === this.intersectedMesh.id))
            ),
            signalHub.movement.on(`${this.hand}_grip_released`).pipe(
                map(() => (this.findIntersectingMesh())),
                filter(val => (val !== null && this.intersectedMesh !== null && val.id === this.intersectedMesh.id)),
                tap(() => (console.log('emit entity_released')))
            ),
        ).pipe(
            take(1)
        )


        // // emit entity grabbed
        // console.log('emit 1')

        // // emit a release if you're still holding it
        // return signalHub.movement.on(`${this.hand}_grip_released`).pipe(
        //     take(1),
        //     tap(() => {
        //         console.log('emit 2')
        //         // emit release
        //     })
        // )


    }

    // createEventPayload(intersectedMesh: BABYLON.AbstractMesh) {
    //     if (!this.palmMesh.rotationQuaternion) {
    //         this.palmMesh.rotationQuaternion = this.palmMesh.rotation.toQuaternion()
    //     }
    //     if (!intersectedMesh.rotationQuaternion) {
    //         intersectedMesh.rotationQuaternion = intersectedMesh.rotation.toQuaternion()
    //     }
    //     return {
    //         member_id: this.orchestrator.member_id,
    //         entity_id: intersectedMesh.id,
    //         hand_pos_rot: {
    //             pos: utils.arrayReduceSigFigs(this.palmMesh.position.asArray()),
    //             rot: utils.arrayReduceSigFigs(this.palmMesh.rotationQuaternion.asArray())
    //         },
    //         entity_pos_rot: {
    //             pos: utils.arrayReduceSigFigs(intersectedMesh.position.asArray()),
    //             rot: utils.arrayReduceSigFigs(intersectedMesh.rotationQuaternion.asArray())
    //         },
    //         hand: this.hand
    //     }
    // }

    // checkRelease() {
    //     const intersectedMesh = this.findIntersectingMesh()
    //     if (intersectedMesh === null) {
    //         return
    //     }
    //     let [mesh, tag] = intersectedMesh
    //     // only release if we're already holding the mesh AND
    //     // the other hand isn't also holding the mesh, otherwise the mesh will be unparented by everyone
    //     if (mesh.parent?.name === this.palmMesh.name) {
    //         let event: event = {
    //             m: "entity_released",
    //             p: this.createEventPayload(mesh)
    //         }
    //         signalHub.outgoing.emit("event", event)
    //         signalHub.incoming.emit("event", event)
    //     }
    // }




    // checkGrab() {
    //     const intersectedMesh = this.findIntersectingMesh()
    //     if (intersectedMesh != null) {
    //         let [mesh, tag] = intersectedMesh
    //         if (tag === "interactable") {
    //             let event: event = {
    //                 m: "entity_grabbed",
    //                 p: this.createEventPayload(mesh)
    //             }

    //             signalHub.outgoing.emit("event", event)
    //             signalHub.incoming.emit("event", event)
    //         } else {
    //             let event: event = {
    //                 m: "entity_assumed",
    //                 p: this.createEventPayload(mesh)
    //             }

    //             signalHub.outgoing.emit("event", event)
    //             signalHub.incoming.emit("event", event)
    //         }
    //     }
    // }

    findIntersectingMesh(): BABYLON.AbstractMesh {
        const meshes = this.scene.getMeshesByTags("interactable")
        return meshes[0]
        for (let i = 0; i < meshes.length; i++) {
            if (meshes[i].intersectsMesh(this.palmMesh)) {
                return meshes[i]
            }
        }
        console.log("no intersections detected")
        return null
    }
}