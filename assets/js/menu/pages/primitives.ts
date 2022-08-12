import * as BABYLON from "babylonjs"
import * as GUI from "babylonjs-gui"

import type { Orchestrator } from "../../orchestrator";
import { signalHub } from "../../signalHub";
import { v4 as uuidv4 } from "uuid";

import { a, div, pre } from "../helpers";
import { random_id } from "../../utils";
import type { Component, event } from "../../types"
import { EventName } from "../../event-names";
import { BoxEntity } from "../../scene/entities/box-entity";
import { GridEntity } from "../../scene/entities/grid-entity";
import { SphereEntity } from "../../scene/entities/sphere-entity";
import { ConeEntity } from "../../scene/entities/cone-entity";
import { PlaneEntity } from "../../scene/entities/plane-entity";
import { CapsuleEntity } from "../../scene/entities/capsule-entity";
import { CylinderEntity } from "../../scene/entities/cylinder-entity";

export class MenuPagePrimitives extends GUI.Container {

    constructor(public scene: BABYLON.Scene) {
        super()

        const callback = () => {
            signalHub.menu.emit("menu_topic", "tools")
        }

        let options = [a({ callback }, "< Tools"), this.scrollablePrimOptions()]

        this.addControl(
            div({ name: "primitives-container" },
                ...options
            ))
    }

    scrollablePrimOptions() {
        return pre({ name: "scrollable-prim-options" }, ...this.primOptions())
    }

    defaultComponents() {
        let data = {
            position: [0, 0.86, 0],
            rotation: [0, 0, 0],
            scaling: [1, 1, 1]
        }

        let forwardVec = this.scene.activeCamera.getDirection(BABYLON.Vector3.Forward()).normalize().scaleInPlace(2.5)
        let assetPosition = this.scene.activeCamera.position.add(forwardVec)
        data.position = assetPosition.asArray().map(num => Math.round(num))
        return data
    }



    primOptions() {
        const options = {
            box: BoxEntity,
            cylinder: CylinderEntity,
            grid: GridEntity,
            sphere: SphereEntity,
            cone: ConeEntity,
            plane: PlaneEntity,
            capsule: CapsuleEntity,
        }
        // const options = ["capsule", "box", "cone", "sphere", "grid", "cylinder", "plane"];

        return Object.entries(options).map(([prim, klass]) => {
            const callback = () => {

                let entity = new klass(this.scene)
                entity.emitCreateEntityEvent()
                /*

                // let ray = this.scene.activeCamera.getForwardRay(1)
                // let dest = ray.origin.add(ray.direction)
                const name = `${prim}_${random_id(6)}`
                const uuid = uuidv4()
                let components = { ... this.defaultComponents() }
                if (prim === "grid") {
                    components.position = [0, -0.01, 0]
                    components.rotation = [1.5708, 0, 0]
                }


                const componentList = Object.entries(components).map(([key, value]) => {
                    return { type: key, data: { value } }
                }) as Component[]

                const entity_event: event = { m: EventName.entity_created, p: { type: prim, id: uuid, name, components: componentList } }

                signalHub.outgoing.emit('event', entity_event)
                signalHub.incoming.emit('event', entity_event)
*/

            }
            return a({ callback }, prim)
        })
    }





}