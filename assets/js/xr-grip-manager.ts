
import * as BABYLON from "babylonjs"
import { distinctUntilChanged, filter, map } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";

const GRIP = "_trigger" // "_squeeze"

export class XRGripManager {
    public hand: "left" | "right"
    public grabMesh: BABYLON.AbstractMesh
    public scene: BABYLON.Scene
    public grabbedMesh: BABYLON.AbstractMesh

    constructor(public orchestrator: Orchestrator, public inputSource: BABYLON.WebXRInputSource, public motionController: BABYLON.WebXRAbstractMotionController) {
        this.scene = orchestrator.sceneManager.scene
        this.hand = motionController.handedness as "left" | "right"

        signalHub.movement.on("left_grab_start").subscribe(() => {
            console.log("left ya got me!!")
        })

        signalHub.movement.on("right_grab_start").subscribe(() => {
            console.log("rrrr ya got me!!")
        })

        // signalHub.local.on("xr_component_changed").pipe(
        //     filter(msg => msg.hand === hand && msg.type === "squeeze" && msg.pressed && msg.touched)
        // )

        motionController.onModelLoadedObservable.add(() => {
            this.grabMesh = BABYLON.MeshBuilder.CreateBox(`${motionController.handedness}GrabMesh`, { size: 0.1 }, this.scene)
            this.grabMesh.showBoundingBox = true
            this.grabMesh.visibility = 0.5
            this.grabMesh.position = (this.hand[0] === "l") ? new BABYLON.Vector3(0.05, -0.05, 0.05) : new BABYLON.Vector3(-0.05, -0.05, 0.05)
            this.grabMesh.parent = inputSource.grip

            signalHub.movement.on(`${this.hand}${GRIP}`).pipe(
                map(val => val.pressed),
                distinctUntilChanged(),
                filter(val => (val === true))
            ).subscribe(val => {

                console.log("in this sub")
                // check intersection
                this.grabbedMesh = this.findGrabbedMesh()
                if (this.grabbedMesh) {
                    console.log("grabbed", this.grabbedMesh)
                    signalHub.movement.emit(`${this.hand}_grab_start`, { entity_id: this.grabbedMesh.id })
                }
            })



        })


    }
    findGrabbedMesh() {
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