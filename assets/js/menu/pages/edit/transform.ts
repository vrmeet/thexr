import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { signalHub } from '../../../signalHub'

import { g, a } from '../../helpers';

export class MenuPageTransform extends GUI.Container {
    public selectedMesh: BABYLON.AbstractMesh
    constructor(public scene: BABYLON.Scene) {
        super()
        this.addControl(
            g(GUI.Rectangle, {},
                a({ target: "edit" }, "< Back"),
                "Select an object to move, rotate or scale it")
        )

        let gizmoManager = new BABYLON.GizmoManager(scene);
        gizmoManager.positionGizmoEnabled = true;
        gizmoManager.rotationGizmoEnabled = true;
        gizmoManager.boundingBoxGizmoEnabled = true;

        gizmoManager.gizmos.positionGizmo.onDragEndObservable.add((data, state) => {
            this.broadcastNewPosition()
        })

        gizmoManager.gizmos.rotationGizmo.onDragEndObservable.add((data, state) => {
            this.broadcastNewRotation()
        })


        gizmoManager.gizmos.boundingBoxGizmo.onScaleBoxDragEndObservable.add((data, state) => {
            this.broadcastNewPosition()
            this.broadcastNewScale()
        })

        gizmoManager.onAttachedToMeshObservable.add((mesh) => {
            this.selectedMesh = mesh
        })


        this.onDisposeObservable.add(() => {

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