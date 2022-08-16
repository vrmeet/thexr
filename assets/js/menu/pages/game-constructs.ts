import * as BABYLON from "babylonjs"
import * as GUI from "babylonjs-gui"

import type { Orchestrator } from "../../orchestrator";
import { signalHub } from "../../signalHub";
import { v4 as uuidv4 } from "uuid";

import { a, div, pre } from "../helpers";
import { random_id, reduceSigFigs } from "../../utils";
import type { Component, event } from "../../types"
import { EventName } from "../../event-names";
import { filter, map } from "rxjs/operators";
import { SpawnPointEntity } from "../../scene/entities/spawn-point-entity";
import { EnemySpawnerEntity } from "../../scene/entities/enemy-spawner-entity";
import { AmmoBoxEntity } from "../../scene/entities/ammo-box-entity";
import { GunEntity } from "../../scene/entities/gun-entity";

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

    componentObjToList(components: any) {
        return Object.entries(components).map(([key, value]) => {
            return { type: key, data: { value } }
        }) as Component[]
    }

    dropOptions() {

        const options = {
            "spawn_point": SpawnPointEntity,
            "enemy_spawner": EnemySpawnerEntity, "ammo_box": AmmoBoxEntity,
            "gun": GunEntity
        }
        // const options = ["spawn_point", "gun", "red_key", "blue_key", "enemy_spawner"];

        return Object.entries(options).map(([prim, klass]) => {
            const callback = () => {
                new klass(this.scene).emitCreateEntityEvent()
                /* 
                  // let ray = this.scene.activeCamera.getForwardRay(1)
                  // let dest = ray.origin.add(ray.direction)
                  const name = `${prim}_${random_id(6)}`
                  const uuid = uuidv4()
  
                  let components = { ...this.defaultComponents() }
  
                  if (prim === "enemy_spawner" || prim === "spawn_point") {
                      components.position[1] = 0.01
                  }
                  if (prim === "red_key") {
                      components["color"] = "#FF0000"
                  } else if (prim === "blue_key") {
                      components["color"] = "#0000FF"
                  }
  
  
                  const componentList = this.componentObjToList(components)
  
                  const entity_event: event = { m: EventName.entity_created, p: { type: prim, id: uuid, name, components: componentList } }
  
                  signalHub.outgoing.emit('event', entity_event)
                  signalHub.incoming.emit('event', entity_event)
  */

            }
            return a({ callback }, prim)
        })
    }

    scrollableConstructOptions() {
        const gotoBarrierMaker = () => { signalHub.menu.emit("menu_topic", "barriermaker") }
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
            a({ name: "goto-wall-maker", callback: gotoBarrierMaker }, "Barrier Maker"),
            ...this.dropOptions()

        )
    }






}