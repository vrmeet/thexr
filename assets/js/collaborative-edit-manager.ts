
import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { div } from './menu/helpers'
import { signalHub } from './signalHub'

export class CollaborativeEditManager {
    public selectedMesh: BABYLON.AbstractMesh
    public entityPlaneContainer: BABYLON.AbstractMesh
    public entityPlane: BABYLON.AbstractMesh
    public entityAdvancedTexture: GUI.AdvancedDynamicTexture
    public gizmoManager: BABYLON.GizmoManager
    public utilLayer: BABYLON.UtilityLayerRenderer
    public pointerObs: BABYLON.Observer<BABYLON.PointerInfo>

    constructor(public scene: BABYLON.Scene) {
        this.utilLayer = new BABYLON.UtilityLayerRenderer(scene);
        var overlayLight = new BABYLON.HemisphericLight("util-light", new BABYLON.Vector3(0, 1, 0), this.utilLayer.utilityLayerScene);
        overlayLight.intensity = 0.7;

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
        if (this.entityPlane) {
            this.entityPlane.dispose()
        }
        this.utilLayer.dispose()
    }

    enableEntityMenu() {
        this.entityPlaneContainer = new BABYLON.AbstractMesh("entity_plane_container")
        this.entityPlane = BABYLON.MeshBuilder.CreatePlane("entity_menu_plane", { size: 0.5 }, this.utilLayer.utilityLayerScene)
        this.entityPlane.parent = this.entityPlaneContainer
        this.entityPlane.showBoundingBox = true
        this.entityPlane.position.x = 0.3
        this.entityPlane.position.y = 0.3
        this.entityPlaneContainer.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        this.entityAdvancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(this.entityPlane, 256, 256)
        let ctrls = div({ name: "entity_menu" }, "Hello", "Goodbye")

        this.entityAdvancedTexture.addControl(ctrls)
    }

    disableEntityMenu() {
        if (this.entityPlane) {
            this.entityPlane.dispose()
            this.entityPlane = null
        }
    }

    off() {

        // stop paying attention to click and double click
        if (this.pointerObs) {
            this.scene.onPointerObservable.remove(this.pointerObs)
        }
        this.disableEntityMenu()
        this.disableTransformGizmo()
    }

    on() {
        this.enableEntityMenu()
        // pay attention to click on util layer
        this.enableTransformGizmo()
        this.utilLayer.utilityLayerScene.onPointerObservable.add(evt => {
            if (evt.type === BABYLON.PointerEventTypes.POINTERUP) {
                if (evt.pickInfo.pickedMesh) {
                    console.log('picked something in util layer')
                    // this.selectedMesh.dispose()

                }
            }
        })

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


    setMenuPosition(mesh: BABYLON.AbstractMesh) {
        // this.entityPlaneContainer.position.copyFrom(mesh.position)

        let direction = mesh.position.subtract(this.scene.activeCamera.position)
        direction = BABYLON.Vector3.Normalize(direction).scaleInPlace(3.5);

        let destination = this.scene.activeCamera.position.add(direction)
        this.entityPlaneContainer.position.copyFrom(destination)

        // this.scene.activeCamera.getViewMatrix(); // make sure the transformation matrix we get when calling 'getTransformationMatrix()' is calculated with an up to date view matrix

        // let invertCameraViewProj = BABYLON.Matrix.Invert(this.scene.activeCamera.getTransformationMatrix());
        // const offsetVector = new BABYLON.Vector3(30, 0, -30)
        // const local = BABYLON.Vector3.TransformCoordinates(offsetVector, invertCameraViewProj);
        // const relativeOffset = this.scene.activeCamera.position.subtract(local)

        // const worldMatrix = this.scene.activeCamera.getWorldMatrix()
        // const offset = BABYLON.Vector3.TransformCoordinates(offsetVector, worldMatrix)
        // console.log('offset', relativeOffset)
        // this.entityPlane.position.subtractInPlace(relativeOffset)
        /*
        
    function vecToLocal(vector, mesh){
        var m = mesh.getWorldMatrix();
        var v = BABYLON.Vector3.TransformCoordinates(vector, m);
        return v;		 
    }

    */

        // this.scene.activeCamera.getForwardRay

        // var forward = new BABYLON.Vector3(0,0,1);		
        // forward = vecToLocal(forward, box);
        // console.log('forward', forward)

        // var direction = forward.subtract(origin);
        // direction = BABYLON.Vector3.Normalize(direction);
    }

    selectMesh(mesh: BABYLON.AbstractMesh) {
        if (this.selectedMesh) {
            // there is nothing todo if this mesh is already selected
            if (this.selectedMesh.name === mesh.name) {
                return
            }


        }
        this.setMenuPosition(mesh)




        this.gizmoManager.attachToMesh(mesh)
        // if (this.mode === "delete") {
        //     this.deleteGizmo = BABYLON.MeshBuilder.CreateTorus("del", {}, this.utilLayer.utilityLayerScene)
        //     this.deleteGizmo.parent = mesh;
        //     (this.deleteGizmo as BABYLON.Mesh).obser
        // }
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