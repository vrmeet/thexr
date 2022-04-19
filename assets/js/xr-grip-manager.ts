
import * as BABYLON from "babylonjs"
import { distinctUntilChanged, filter, map } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";
import type { event } from "./types"
import * as utils from "./utils"

const GRIP = "_trigger" // "_squeeze"

export class XRGripManager {
    public hand: "left" | "right"
    public other_hand: "left" | "right"
    public grabMesh: BABYLON.AbstractMesh
    public scene: BABYLON.Scene

    constructor(public orchestrator: Orchestrator, public inputSource: BABYLON.WebXRInputSource, public motionController: BABYLON.WebXRAbstractMotionController) {
        this.scene = orchestrator.sceneManager.scene
        this.hand = motionController.handedness as "left" | "right"
        this.other_hand = (this.hand === "left") ? "right" : "left"

        motionController.onModelLoadedObservable.add(() => {
            this.grabMesh = BABYLON.MeshBuilder.CreateBox(`avatar_${this.orchestrator.member_id}_${this.hand}`, { size: 0.1 }, this.scene)
            this.grabMesh.showBoundingBox = true
            this.grabMesh.visibility = 0.5
            this.grabMesh.position = (this.hand[0] === "l") ? new BABYLON.Vector3(0.05, -0.05, 0.05) : new BABYLON.Vector3(-0.05, -0.05, 0.05)
            this.grabMesh.parent = inputSource.grip

            signalHub.movement.on(`${this.hand}${GRIP}`).pipe(
                map(val => val.pressed),
                distinctUntilChanged(),
            ).subscribe(squeezing => {
                if (squeezing) {
                    this.checkGrab()
                } else {
                    this.checkRelease()
                }

            })



        })


    }

    createEventPayload(intersectedMesh: BABYLON.AbstractMesh) {
        if (!this.grabMesh.rotationQuaternion) {
            this.grabMesh.rotationQuaternion = this.grabMesh.rotation.toQuaternion()
        }
        if (!intersectedMesh.rotationQuaternion) {
            intersectedMesh.rotationQuaternion = intersectedMesh.rotation.toQuaternion()
        }
        return {
            member_id: this.orchestrator.member_id,
            entity_id: intersectedMesh.id,
            hand_pos_rot: {
                pos: utils.arrayReduceSigFigs(this.grabMesh.position.asArray()),
                rot: utils.arrayReduceSigFigs(this.grabMesh.rotationQuaternion.asArray())
            },
            entity_pos_rot: {
                pos: utils.arrayReduceSigFigs(intersectedMesh.position.asArray()),
                rot: utils.arrayReduceSigFigs(intersectedMesh.rotationQuaternion.asArray())
            },
            hand: this.hand
        }
    }

    checkRelease() {
        const intersectedMesh = this.findIntersectingMesh()
        // only release if we're already holding the mesh AND
        // the other hand isn't also holding the mesh, otherwise the mesh will be unparented by everyone
        if (intersectedMesh && intersectedMesh.parent?.name === this.grabMesh.name) {
            let event: event = {
                m: "entity_released",
                p: this.createEventPayload(intersectedMesh)
            }
            signalHub.outgoing.emit("event", event)
            signalHub.incoming.emit("event", event)
        }
    }




    checkGrab() {
        const intersectedMesh = this.findIntersectingMesh()
        if (intersectedMesh) {

            let event: event = {
                m: "entity_grabbed",
                p: this.createEventPayload(intersectedMesh)
            }
            signalHub.outgoing.emit("event", event)
            signalHub.incoming.emit("event", event)
        }
    }

    findIntersectingMesh() {
        const meshes = this.scene.getMeshesByTags("interactable")
        for (let i = 0; i < meshes.length; i++) {
            if (meshes[i].intersectsMesh(this.grabMesh)) {
                console.log("found intersection")
                return meshes[i]
            }
        }
        console.log("no intersections detected")
        return null
    }
}