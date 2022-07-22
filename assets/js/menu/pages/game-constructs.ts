import type * as BABYLON from "babylonjs"
import * as GUI from "babylonjs-gui"

import type { Orchestrator } from "../../orchestrator";
import { signalHub } from "../../signalHub";
import { v4 as uuidv4 } from "uuid";

import { a, div, pre } from "../helpers";
import { random_id, reduceSigFigs } from "../../utils";
import type { Component, event } from "../../types"
import { EventName } from "../../event-names";
import { filter, map } from "rxjs/operators";

export class GameConstructs extends GUI.Container {
    public wallPoints: BABYLON.Vector3[]
    public pointIndicators: BABYLON.AbstractMesh[]
    public referenceIndicator: BABYLON.AbstractMesh
    public lines: BABYLON.LinesMesh




    constructor(public scene: BABYLON.Scene) {
        super()
        const callback = () => {
            signalHub.menu.emit("menu_topic", "tools")
        }

        let options = [a({ callback }, "< Tools"), this.scrollableConstructOptions()]

        this.addControl(
            div({ name: "constructs-container" },
                ...options
            ))

    }

    defaultComponents() {
        return {
            position: [0, 0.86, 0],
            rotation: [0, 0, 0],
            scaling: [1, 1, 1],
        }
    }

    componentObjToList(components: any) {
        return Object.entries(components).map(([key, value]) => {
            return { type: key, data: { value } }
        }) as Component[]
    }

    dropOptions() {
        const options = ["spawn_point", "gun", "key", "enemy_spawner"];

        return options.map(prim => {
            const callback = () => {
                // let ray = this.scene.activeCamera.getForwardRay(1)
                // let dest = ray.origin.add(ray.direction)
                const name = `${prim}_${random_id(6)}`
                const uuid = uuidv4()
                let components = { ...this.defaultComponents() }
                if (prim === "enemy_spawner" || prim === "spawn_point") {
                    components.position = [0, 0.01, 0]
                }

                const componentList = this.componentObjToList(components)

                const entity_event: event = { m: EventName.entity_created, p: { type: prim, id: uuid, name, components: componentList } }

                signalHub.outgoing.emit('event', entity_event)
                signalHub.incoming.emit('event', entity_event)


            }
            return a({ callback }, prim)
        })
    }

    scrollableConstructOptions() {
        const gotoWallMaker = () => { signalHub.menu.emit("menu_topic", "wallmaker") }
        const dropAmmoBox = () => {
            let components = {
                color: "#F002A3",
                ammo: 10,
                ... this.defaultComponents()
            }
            const entity_event: event = { m: EventName.entity_created, p: { type: "ammo_box", id: uuidv4(), name: `ammo_box_${random_id(5)}`, components: this.componentObjToList(components) } }

            signalHub.outgoing.emit('event', entity_event)
            signalHub.incoming.emit('event', entity_event)

        }
        return pre({ name: "scrollable-prim-options" },
            a({ name: "goto-wall-maker", callback: gotoWallMaker }, "wallmaker"),
            a({ name: "ammo-box", callback: dropAmmoBox }, "ammo_box"),
            ...this.dropOptions()

        )
    }






}