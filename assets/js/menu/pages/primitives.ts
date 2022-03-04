import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { signalHub } from '../../signalHub';

import { span, a, div, toggle } from '../helpers';


export class MenuPagePrimitives extends GUI.Container {
    constructor() {
        super()
        const callback = () => { signalHub.emit('menu_action', { name: "goto_main" }) }

        let options = [a({ callback }, "< Main"), ...this.primOptions()]


        this.addControl(
            div({ name: "primitives-container" },
                ...options
            ))
    }

    primOptions() {
        const options = ["box", "cone", "sphere", "grid", "plane"];

        return options.map(prim => {
            const callback = () => {
                signalHub.emit('spaces_api', { func: "add_entity_with_broadcast", args: [prim] })
            }
            return a({ callback }, prim)
        })
    }





}