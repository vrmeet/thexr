import type * as BABYLON from "babylonjs"
import * as GUI from "babylonjs-gui"

import type { Orchestrator } from "../../orchestrator";
import { signalHub } from "../../signalHub";
import { v4 as uuidv4 } from "uuid";

import { a, div, pre } from "../helpers";
import { random_id } from "../../utils";
import type { Component, event } from "../../types"

export class MenuPagePrimitives extends GUI.Container {
    public scene: BABYLON.Scene
    constructor(public orchestrator: Orchestrator) {
        super()
        this.scene = this.orchestrator.sceneManager.scene

        const callback = () => { signalHub.observables.menu_page.next("tools") }

        let options = [a({ callback }, "< Tools"), this.scrollablePrimOptions()]

        this.addControl(
            div({ name: "primitives-container" },
                ...options
            ))
    }

    scrollablePrimOptions() {
        return pre({ name: "scrollable-prim-options" }, ...this.primOptions())
    }

    primOptions() {
        const options = ["box", "cone", "sphere", "grid", "plane"];

        return options.map(prim => {
            const callback = () => {
                // let ray = this.scene.activeCamera.getForwardRay(1)
                // let dest = ray.origin.add(ray.direction)
                const name = `${prim}_${random_id(6)}`
                const uuid = uuidv4()
                let components = {
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scaling: [1, 1, 1],
                }
                if (prim === "grid") {
                    components.position = [0, -0.01, 0]
                    components.rotation = [1.5708, 0, 0]
                }

                const componentList = Object.entries(components).map(([key, value]) => {
                    return { type: key, data: { value } }
                }) as Component[]

                const entity_event: event = { m: "entity_created", p: { type: prim, id: uuid, name, components: componentList } }

                signalHub.outgoing.emit('event', entity_event)
                signalHub.incoming.emit('event', entity_event)

                // this.orchestrator.sceneManager.findOrCreateMesh({
                //     type: prim,
                //     name,
                //     id: uuid,
                //     components: Object.entries(components).map(([key, value]) => {
                //         if (key === "color") {
                //             return { type: key, data: { value: value } }
                //         }
                //         return { type: key, data: value }
                //     })
                // })

                // signalHub.outgoing.emit("spaces_api", { func: "added_entity_with_broadcast", args: [uuid, name, prim, components] })
            }
            return a({ callback }, prim)
        })
    }





}