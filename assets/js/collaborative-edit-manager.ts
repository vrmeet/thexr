
import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { div } from './menu/helpers'
import { signalHub } from './signalHub'

export class CollaborativeEditManager {
    public selectedMesh: BABYLON.AbstractMesh
    public gizmoManager: BABYLON.GizmoManager
    public pointerObs: BABYLON.Observer<BABYLON.PointerInfo>

    constructor(public scene: BABYLON.Scene) {

        signalHub.observables.editing.subscribe(value => {
            if (value) {
                this.on()
            } else {
                this.off()
            }
        })
    }

    dispose() {
        if (this.gizmoManager) {
            this.gizmoManager.dispose()
        }

    }


    off() {
        this.scene.onPointerObservable.remove(this.pointerObs)
        this.disableTransformGizmo()
    }

    on() {
        // pay attention to click on util layer
        this.enableTransformGizmo()

        // pay attention to click and double click on the scene
        this.pointerObs = this.scene.onPointerObservable.add(evt => {
            if (evt.type === BABYLON.PointerEventTypes.POINTERPICK) {
                let mesh = evt.pickInfo.pickedMesh


                if (mesh && BABYLON.Tags.MatchesQuery(mesh, "editable")) {
                    this.selectMesh(mesh)
                }
            }

        })
    }



    selectMesh(mesh: BABYLON.AbstractMesh) {
        if (this.selectedMesh) {
            // there is nothing todo if this mesh is already selected
            if (this.selectedMesh.name === mesh.name) {
                return
            }


        }



        this.gizmoManager.attachToMesh(mesh)

        this.selectedMesh = mesh
    }



    disableTransformGizmo() {
        if (this.gizmoManager) {
            this.gizmoManager.dispose()
        }
    }

    enableTransformGizmo() {

        this.gizmoManager = new BABYLON.GizmoManager(this.scene);

        this.gizmoManager.positionGizmoEnabled = true;
        this.gizmoManager.boundingBoxGizmoEnabled = true;
        this.gizmoManager.usePointerToAttachGizmos = false;

        this.gizmoManager.gizmos.positionGizmo.onDragEndObservable.add((data, state) => {
            this.broadcastNewPosition()
        })

        this.gizmoManager.gizmos.boundingBoxGizmo.onRotationSphereDragEndObservable.add((data, state) => {
            this.broadcastNewRotation()
        })

        this.gizmoManager.gizmos.boundingBoxGizmo.onScaleBoxDragEndObservable.add((data, state) => {
            this.broadcastNewPosition()
            this.broadcastNewScale()
        })


    }




    broadcastNewPosition() {
        const pos = this.selectedMesh.position
        signalHub.outgoing.emit('spaces_api', {
            func: "modify_component_with_broadcast",
            args: [this.selectedMesh.id, "position", { x: pos.x, y: pos.y, z: pos.z }],
        });
    }

    broadcastNewRotation() {

        const rot = this.selectedMesh.rotationQuaternion.toEulerAngles()

        signalHub.outgoing.emit('spaces_api', {
            func: "modify_component_with_broadcast",
            args: [this.selectedMesh.id, "rotation", { x: rot.x, y: rot.y, z: rot.z }],
        });
    }

    broadcastNewScale() {
        const scale = this.selectedMesh.scaling
        signalHub.outgoing.emit('spaces_api', {
            func: "modify_component_with_broadcast",
            args: [this.selectedMesh.id, "scale", { x: scale.x, y: scale.y, z: scale.z }],
        });
    }


}