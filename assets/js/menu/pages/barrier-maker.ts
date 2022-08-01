import * as BABYLON from "babylonjs"
import * as GUI from "babylonjs-gui"

import type { Orchestrator } from "../../orchestrator";
import { signalHub } from "../../signalHub";
import { v4 as uuidv4 } from "uuid";

import { a, div, pre, span, toggle } from "../helpers";
import { random_id, reduceSigFigs, arrayReduceSigFigs } from "../../utils";
import type { Component, event } from "../../types"
import { EventName } from "../../event-names";
import { filter, map } from "rxjs/operators";
import { createWall } from "../../scene/constructs";

export class BarrierMaker extends GUI.Container {
    public wallPoints: BABYLON.Vector3[]
    public pointIndicators: BABYLON.AbstractMesh[]
    public referenceIndicator: BABYLON.AbstractMesh
    public lines: BABYLON.LinesMesh


    constructor(public scene: BABYLON.Scene) {
        super()

        this.wallPoints = []
        this.pointIndicators = []

        const lineOpts = {
            points: this.wallPoints,
            dashSize: 2,
            gapSize: 1,
            dashNb: 80
        }

        this.referenceIndicator = BABYLON.MeshBuilder.CreateCylinder("", { height: 1, diameter: 0.1 })
        this.referenceIndicator.setEnabled(false)
        const callback = () => {
            signalHub.menu.emit("menu_topic", "gameconstructs")
        }

        let options = [a({ callback }, "< Game Constructs"), this.scrollablePrimOptions()]

        this.addControl(
            div({ name: "primitives-container" },
                ...options
            ))



        let sub = signalHub.local.on("pointer_info").pipe(
            filter(info => info.type === BABYLON.PointerEventTypes.POINTERPICK),
            filter(info => info.pickInfo.pickedMesh && info.pickInfo.pickedMesh.metadata?.menu !== true),
            map((info: BABYLON.PointerInfo) => info.pickInfo.pickedPoint),
        ).subscribe(point => {
            let indicator = this.getPointIndicator(point)
            this.pointIndicators.push(indicator)
            this.wallPoints.push(point)
            if (this.wallPoints.length > 1) {
                if (this.lines) {
                    this.lines.dispose()
                }
                this.lines = BABYLON.MeshBuilder.CreateDashedLines("wallLines", lineOpts);
            }
        })

        this.onDisposeObservable.add(() => {
            this.reset()
            this.referenceIndicator.dispose()
            sub.unsubscribe()
        })
    }

    getPointIndicator(position: BABYLON.Vector3) {
        let clone = this.referenceIndicator.clone("", null)
        clone.setEnabled(true)
        clone.position = position
        return clone
    }

    barrierColor(entity_type: string) {
        switch (entity_type) {
            case "wall":
                return "#bdb76b"
            case "door":
                return "#a3a3c2"
            case "red_door":
                return "#800000"
            case "blue_door":
                return "#000080"
        }
    }

    reset() {
        this.pointIndicators.forEach(mesh => mesh.dispose())
        this.pointIndicators.length = 0
        if (this.lines) {
            this.lines.dispose()
        }
        this.wallPoints.length = 0
    }

    scrollablePrimOptions() {


        const create = (entity_type: string) => {
            return () => {
                if (this.wallPoints.length < 2) {
                    signalHub.local.emit("hud_msg", "You need at least 2 points to build a wall")
                    return
                }
                signalHub.local.emit("hud_msg", `Created ${entity_type}`)

                const xzPoints = this.wallPoints.reduce((acc, wallPoint) => {
                    acc.push(reduceSigFigs(wallPoint.x))
                    acc.push(reduceSigFigs(wallPoint.z))
                    return acc
                }, [])
                const wallId = uuidv4()
                const wallName = `${entity_type}_${random_id(5)}`
                const tempWallMesh = createWall(wallName, 2, xzPoints, this.scene)
                const tempCenter = tempWallMesh.getBoundingInfo().boundingBox.center
                const worldOffset = new BABYLON.TransformNode("", this.scene)
                worldOffset.position = tempCenter
                this.pointIndicators.forEach(indicator => indicator.setParent(worldOffset))
                worldOffset.position = BABYLON.Vector3.Zero()
                const adjustedXZPoints = this.pointIndicators.reduce((acc, indicator) => {
                    acc.push(reduceSigFigs(indicator.position.x))
                    acc.push(reduceSigFigs(indicator.position.z))
                    return acc
                }, [])

                // for now wall only draws at y = 0
                tempCenter.y = 0;

                let payload = {
                    type: entity_type,
                    id: wallId,
                    name: wallName,
                    components: [
                        { type: "position", data: { value: arrayReduceSigFigs(tempCenter.asArray()) } },
                        { type: "color", data: { value: this.barrierColor(entity_type) } },
                        { type: "height", data: { value: 2 } },
                        { type: "points", data: { value: adjustedXZPoints } }
                    ]
                }

                let event: any = { m: EventName.entity_created, p: payload }

                tempWallMesh.dispose()

                signalHub.outgoing.emit("event", event)
                signalHub.incoming.emit("event", event)

                this.reset()
            }
        }
        return pre({ name: "scrollable-prim-options" },
            "Point on the floor to create wall corners",
            a({ callback: this.reset }, "Reset"),
            a({ callback: create("wall") }, "Create Wall"),
            a({ callback: create("door") }, "Create Door"),
            a({ callback: create("red_door") }, "Create Red Door"),
            a({ callback: create("blue_door") }, "Create Blue Door")
        )
    }




    // primOptions() {
    //     const options = ["wall_start", "wall_end"];

    //     return options.map(prim => {
    //         const callback = () => {
    //             // let ray = this.scene.activeCamera.getForwardRay(1)
    //             // let dest = ray.origin.add(ray.direction)
    //             const name = `${prim}_${random_id(6)}`
    //             const uuid = uuidv4()
    //             let components = {
    //                 position: [0, 0.86, 0],
    //                 rotation: [0, 0, 0],
    //                 scaling: [1, 1, 1],
    //             }
    //             if (prim === "grid") {
    //                 components.position = [0, -0.01, 0]
    //                 components.rotation = [1.5708, 0, 0]
    //             }

    //             const componentList = Object.entries(components).map(([key, value]) => {
    //                 return { type: key, data: { value } }
    //             }) as Component[]

    //             const entity_event: event = { m: EventName.entity_created, p: { type: prim, id: uuid, name, components: componentList } }

    //             signalHub.outgoing.emit('event', entity_event)
    //             signalHub.incoming.emit('event', entity_event)


    //         }
    //         return a({ callback }, prim)
    //     })
    // }





}