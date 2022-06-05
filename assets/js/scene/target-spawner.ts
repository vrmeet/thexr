import type * as BABYLON from "babylonjs"
import { signalHub } from "../signalHub"
import { random_id } from "../utils"
import { v4 as uuidv4 } from "uuid";
import type { Component, event } from "../types"
import { EventName } from "../event-names";

export class TargetSpawner {
    constructor(public scene: BABYLON.Scene) {
        signalHub.local.on("space_channel_connected").subscribe(() => {
            this.spawn(1)
        })

    }

    spawn(timeout: number) {
        setTimeout(() => {
            const prim = "cylinder"
            const name = `${prim}_${random_id(6)}`
            const uuid = uuidv4()
            let components = {
                position: [Math.random() * 10 - 5, Math.random() * 3, Math.random() * 10 - 5],
                rotation: [0, 0, 0],
                scaling: [1, 1, 1],
            }


            const componentList = Object.entries(components).map(([key, value]) => {
                return { type: key, data: { value } }
            }) as Component[]

            const entity_event: event = { m: EventName.entity_created, p: { type: prim, id: uuid, name, components: componentList } }

            signalHub.outgoing.emit('event', entity_event)
            signalHub.incoming.emit('event', entity_event)
            this.spawn(Math.random() * 3000)

        }, timeout)
    }
}