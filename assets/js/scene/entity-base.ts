import * as BABYLON from "babylonjs"
import { EventName } from "../event-names"
import { signalHub } from "../signalHub"
import type { Component, event } from "../types"
import { arrayReduceSigFigs, findOrCreateMaterial, random_id } from "../utils"
import { v4 as uuidv4 } from "uuid";

const ANIMATION_FRAME_PER_SECOND = 60
const TOTAL_ANIMATION_FRAMES = 5


export abstract class EntityBase {
    public mesh: BABYLON.AbstractMesh
    public id: string
    public name: string
    public components: Component[]

    constructor(public type: string, public scene: BABYLON.Scene) {

    }

    buildMeshFromEvent(id: string, name: string, components: Component[]) {
        this.id = id
        this.name = name
        this.components = components
        BABYLON.Tags.EnableFor(this)
        this.mesh = this.createMesh()
        this.setMeshAttrs()
        signalHub.local.emit("mesh_built", { name: this.mesh.name, type: this.type })
        this.animateOnCreate()
        return this.mesh
    }


    abstract createMesh(): BABYLON.AbstractMesh


    emitCreateEntityEvent(opts: any = {}) {
        // let dest = ray.origin.add(ray.direction)
        const name = `${this.type}_${random_id(6)}`
        const uuid = uuidv4()

        const entity_event: event = { m: EventName.entity_created, p: { type: this.type, id: uuid, name, components: this.defaultComponents() } }

        signalHub.outgoing.emit('event', entity_event)
        signalHub.incoming.emit('event', entity_event)

    }


    /**
     * Takes a list of components, and returns key/values that may or may not work with
     * BABYLON's MeshBuilder
     * @param components 
     * @returns 
     */
    argifyComponents(components: Component[], keep: string[]): any {
        return components.reduce((acc, component) => {
            if (keep.includes(component.type)) {
                acc[component.type] = component.data.value
            }
            return acc
        }, {})
    }

    setMeshAttrs() {
        this.mesh.id = this.id
        this.mesh.metadata = { type: this.type, ref: this }
        // BABYLON.Tags.AddTagsTo(this.mesh, "editable")
        // signal to teleportation manager
        this.setPositionFromComponent()
        this.setRotationFromComponent()
        this.setScaleFromComponent()
        this.setColorFromComponent()
        this.setMaterialFromComponent()
        this.setEditableFromComponent()
        this.setTeleportableFromComponent()
    }

    animateOnCreate() {
        // BABYLON.Animation.CreateAndStartAnimation("appear", this.mesh, "position", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, this.mesh.position.add(new BABYLON.Vector3(0,10,0)), this.mesh.position, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        BABYLON.Animation.CreateAndStartAnimation("appear", this.mesh, "position.y", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, this.mesh.position.y + 10, this.mesh.position.y, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    }

    setTeleportableFromComponent() {
        let comp = this.getComponentByType("teleportable")
        if (comp) {
            BABYLON.Tags.AddTagsTo(this.mesh, "teleportable")
        }
    }

    setEditableFromComponent() {
        let comp = this.getComponentByType("editable")
        if (comp) {
            BABYLON.Tags.AddTagsTo(this.mesh, "editable")
        }
    }

    setColorFromComponent() {
        let comp = this.getComponentByType("color")
        if (comp) {
            let colorString = comp.data.value as string
            let mat;
            if (colorString.startsWith("#")) {
                mat = findOrCreateMaterial({ type: "color", colorString }, this.scene)
                this.mesh.material = mat;
            }
        }
    }


    setMaterialFromComponent() {
        let comp = this.getComponentByType("material")
        if (comp) {
            let nickname = comp.data.value as string
            let mat;
            if (nickname === "grid") {
                mat = findOrCreateMaterial({ type: "grid" }, this.scene)
                this.mesh.material = mat;
            }
        }
    }

    setPositionFromComponent() {
        let comp = this.getComponentByType("position")
        if (comp) {
            let posArray = comp.data.value
            this.mesh.position.fromArray(posArray)
        }
    }

    setRotationFromComponent() {
        let comp = this.getComponentByType("rotation")
        if (comp) {
            const rawValue = comp.data.value
            let newQuaternion;
            if (rawValue.length === 3) {
                // change euler to quaternions
                newQuaternion = BABYLON.Vector3.FromArray(rawValue).toQuaternion()
            } else {
                newQuaternion = BABYLON.Quaternion.FromArray(rawValue)
            }
            if (this.mesh.rotationQuaternion === null) {
                this.mesh.rotationQuaternion = newQuaternion
            } else {
                this.mesh.rotationQuaternion.copyFrom(newQuaternion)
            }
        }
    }

    setScaleFromComponent() {
        let comp = this.getComponentByType("scaling")
        if (comp) {
            let array = comp.data.value
            this.mesh.scaling.fromArray(array)
        }
    }

    getComponentByType(type: string) {
        let result = this.components.filter(comp => comp.type === type)
        if (result.length > 0) {
            return result[0]
        } else {
            return null
        }
    }

    cameraFrontPosition() {
        let forwardVec = this.scene.activeCamera.getDirection(BABYLON.Vector3.Forward()).normalize().scaleInPlace(2.5)
        let assetPosition = this.scene.activeCamera.position.add(forwardVec)
        return arrayReduceSigFigs(assetPosition.asArray())
    }

    cameraFrontFloorPosition() {
        let forwardVec = this.scene.activeCamera.getDirection(BABYLON.Vector3.Forward()).normalize().scaleInPlace(2.5)
        console.log('forwardVec', forwardVec)
        let assetPosition = this.scene.activeCamera.position.add(forwardVec)
        console.log('assetPosition', assetPosition)
        let ray = new BABYLON.Ray(assetPosition, BABYLON.Vector3.Down())
        ray.length = 20
        console.log('ray', ray)
        let pickInfo = this.scene.pickWithRay(ray)

        console.log('pickInfo', pickInfo)
        if (pickInfo.hit) {
            return arrayReduceSigFigs(pickInfo.pickedPoint.asArray())
        } else {
            return assetPosition.asArray()
        }
    }

    defaultPosition() {
        return this.cameraFrontPosition()
    }

    defaultRotation() {
        return null // no need, if no rotation
    }

    defaultScaling() {
        return null // no need, if no scaling
    }

    defaultColor() {
        return null
    }

    defaultMaterial() {
        return null
    }

    /**
     * can rotate scale re-position this object
     * @returns 
     */
    defaultIsEditable() {
        return true
    }

    /**
     * Can teleport on top of this object
     * @returns 
     */
    defaultCanTeleportTo() {
        return false
    }

    defaultComponentAsObject() {
        let data = { position: this.defaultPosition() }
        let rotation = this.defaultRotation()
        if (rotation) {
            data["rotation"] = rotation
        }
        let scaling = this.defaultScaling()
        if (scaling) {
            data["scaling"] = scaling
        }

        // only choose one of color or material
        let color = this.defaultColor()
        let material = this.defaultMaterial()
        if (color) {
            data["color"] = this.defaultColor()
        } else if (material) {
            data["material"] = material
        }


        if (this.defaultIsEditable()) {
            data["editable"] = true
        }
        if (this.defaultCanTeleportTo()) {
            data["teleportable"] = true
        }

        let additional = this.additionalComponentsAsObj()
        if (additional) {
            return { ...data, ...additional }
        }

        return data
    }

    additionalComponentsAsObj() {
        return null
    }

    componentObjectToList(componentObject: any) {
        return Object.entries(componentObject).map(([key, value]) => {
            return { type: key, data: { value } }
        }) as Component[]
    }


    defaultComponents(): Component[] {
        return this.componentObjectToList(this.defaultComponentAsObject())
    }



}