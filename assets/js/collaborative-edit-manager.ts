
import * as BABYLON from 'babylonjs'
import { signalHub } from './signalHub'

export class CollaborativeEditManager {
    public selectedMesh: BABYLON.AbstractMesh
    public gizmoManager: BABYLON.GizmoManager
    constructor(public scene: BABYLON.Scene) {
        console.log('the scen eis', this.scene)
    }

    off() {
        if (this.gizmoManager) {
            this.gizmoManager.dispose()
        }
    }

    on() {
        this.gizmoManager = new BABYLON.GizmoManager(this.scene);
        this.gizmoManager.positionGizmoEnabled = true;
        this.gizmoManager.rotationGizmoEnabled = true;
        this.gizmoManager.boundingBoxGizmoEnabled = true;

        this.gizmoManager.gizmos.positionGizmo.onDragEndObservable.add((data, state) => {
            this.broadcastNewPosition()
        })

        this.gizmoManager.gizmos.rotationGizmo.onDragEndObservable.add((data, state) => {
            this.broadcastNewRotation()
        })


        this.gizmoManager.gizmos.boundingBoxGizmo.onScaleBoxDragEndObservable.add((data, state) => {
            this.broadcastNewPosition()
            this.broadcastNewScale()
        })

        this.gizmoManager.onAttachedToMeshObservable.add((mesh) => {
            this.selectedMesh = mesh
        })
    }


    broadcastNewPosition() {
        const pos = this.selectedMesh.position
        signalHub.next({
            event: "spaces_api",
            payload: {
                func: "modify_component_with_broadcast",
                args: [this.selectedMesh.id, "position", { x: pos.x, y: pos.y, z: pos.z }],
            },
        });
    }

    broadcastNewRotation() {

        const rot = this.selectedMesh.rotationQuaternion.toEulerAngles()

        console.log('new rotation', rot)
        signalHub.next({
            event: "spaces_api",
            payload: {
                func: "modify_component_with_broadcast",
                args: [this.selectedMesh.id, "rotation", { x: rot.x, y: rot.y, z: rot.z }],
            },
        });
    }

    broadcastNewScale() {

        const scale = this.selectedMesh.scaling
        signalHub.next({
            event: "spaces_api",
            payload: {
                func: "modify_component_with_broadcast",
                args: [this.selectedMesh.id, "scale", { x: scale.x, y: scale.y, z: scale.z }],
            },
        });

    }


}