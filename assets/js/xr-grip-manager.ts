
import * as BABYLON from "babylonjs"
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";

export class XRGripManager {
    public hand: string
    public grabMesh: BABYLON.AbstractMesh
    public scene: BABYLON.Scene
    constructor(public orchestrator: Orchestrator, public inputSource: BABYLON.WebXRInputSource, public motionController: BABYLON.WebXRAbstractMotionController) {
        this.scene = orchestrator.sceneManager.scene
        this.hand = motionController.handedness



        // signalHub.local.on("xr_component_changed").pipe(
        //     filter(msg => msg.hand === hand && msg.type === "squeeze" && msg.pressed && msg.touched)
        // )

        motionController.onModelLoadedObservable.add(() => {
            this.grabMesh = BABYLON.MeshBuilder.CreateBox(`${motionController.handedness}GrabMesh`, { size: 0.1 }, this.scene)
            this.grabMesh.showBoundingBox = true
            this.grabMesh.visibility = 0.5
            this.grabMesh.position = (this.hand[0] === "l") ? new BABYLON.Vector3(0.05, -0.05, 0.05) : new BABYLON.Vector3(-0.05, -0.05, 0.05)
            this.grabMesh.parent = inputSource.grip
        })


    }
}