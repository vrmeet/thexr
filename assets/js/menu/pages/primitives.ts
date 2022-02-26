import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

import { span, a, div, toggle } from '../helpers';


export class MenuPagePrimitives extends GUI.Container {
    constructor() {
        super()

        let options = [a({ menu_action: { name: "goto_main" } }, "< Main"), ...this.primOptions()]


        this.addControl(
            div({ name: "primitives-container" },
                ...options
            ))
    }

    primOptions() {
        const options = ["box", "cone", "sphere", "grid", "plane"];
        return options.map(prim => {
            return a({ menu_action: { name: "create_primitive", payload: { type: prim } } }, prim)
        })
    }





}