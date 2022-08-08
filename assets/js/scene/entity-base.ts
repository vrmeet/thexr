import * as BABYLON from "babylonjs"
import { EventName } from "../event-names"
import { signalHub } from "../signalHub"
import type { Component, event } from "../types"
import { findOrCreateMaterial, random_id } from "../utils"
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
        return this.mesh
    }


    abstract createMesh(): BABYLON.AbstractMesh

    defaultComponents(): Component[] {
        return this.componentObjectToList(this.defaultComponentAsObject())
    }

    emitCreateEntityEvent() {
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
    argifyComponents(components: { type: string, data: { value: any } }[]) {
        const blackList = ["scaling", "position", "rotation"]
        return components.reduce((acc, component) => {
            if (!blackList.includes(component.type)) {
                acc[component.type] = component.data.value
            }
            return acc
        }, {})
    }

    setMeshAttrs() {
        this.mesh.id = this.id
        this.mesh.metadata = { type: this.type, components: this.components }
        // BABYLON.Tags.AddTagsTo(this.mesh, "editable")
        // signal to teleportation manager
        this.setPositionFromComponent()
        this.setRotationFromComponent()
        this.setScaleFromComponent()
        this.setColorFromComponent()
    }

    animateOnCreate() {
        BABYLON.Animation.CreateAndStartAnimation("appear", this.mesh, "position.y", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, this.mesh.position.y + 10, this.mesh.position, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }

    setColorFromComponent() {
        let comp = this.getComponentByType("color")
        if (comp) {
            let colorString = comp.data.value

            const mat = findOrCreateMaterial({ type: "color", colorString }, this.scene)
            this.mesh.material = mat;
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

    defaultComponentAsObject() {
        let data = {
            rotation: [0, 0, 0],
            scaling: [1, 1, 1]
        }

        let forwardVec = this.scene.activeCamera.getDirection(BABYLON.Vector3.Forward()).normalize().scaleInPlace(2.5)
        let assetPosition = this.scene.activeCamera.position.add(forwardVec)
        data["position"] = assetPosition.asArray().map(num => Math.round(num))
        return data
    }

    componentObjectToList(componentObject: any) {
        return Object.entries(componentObject).map(([key, value]) => {
            return { type: key, data: { value } }
        }) as Component[]
    }



}