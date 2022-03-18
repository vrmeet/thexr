import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

import type { Orchestrator } from '../../orchestrator';
import { signalHub } from '../../signalHub';
import { v4 as uuidv4 } from 'uuid';

import { a, div, pre } from '../helpers';
import { random_id } from '../../utils';


export class MenuPagePrimitives extends GUI.Container {
    public scene: BABYLON.Scene
    constructor(public orchestrator: Orchestrator) {
        super()
        this.scene = this.orchestrator.sceneManager.scene

        const callback = () => { signalHub.observables.menu_page.next("main") }

        let options = [a({ callback }, "< Main"), this.scrollablePrimOptions()]

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
                let ray = this.scene.activeCamera.getForwardRay(1)
                let dest = ray.origin.add(ray.direction)
                const name = `${prim}_${random_id(6)}`
                const uuid = uuidv4()
                const components = {
                    position: { x: dest.x, y: dest.y, z: dest.z },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 },
                    color: "#FFFFFF"
                }
                this.orchestrator.sceneManager.findOrCreateMesh({
                    type: prim,
                    name,
                    id: uuid,
                    components: Object.entries(components).map(([key, value]) => {
                        if (key === 'color') {
                            return { type: key, data: { value: value } }
                        }
                        return { type: key, data: value }
                    })
                })

                signalHub.outgoing.emit('spaces_api', { func: "added_entity_with_broadcast", args: [uuid, name, prim, components] })
            }
            return a({ callback }, prim)
        })
    }





}