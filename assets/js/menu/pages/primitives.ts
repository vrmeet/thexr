import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

import { span, a, div, toggle } from '../helpers';


export class MenuPagePrimitives extends GUI.Container {
    constructor() {
        super()

        let options = [a({ msg: { event: "menu_action", payload: { name: "goto_main" } } }, "< Main"), ...this.primOptions()]


        this.addControl(
            div({ name: "primitives-container" },
                ...options
            ))
    }

    primOptions() {
        const options = ["box", "cone", "sphere", "grid", "plane"];
        return options.map(prim => {
            return a({ msg: { event: "menu_action", payload: { name: "create_primitive", type: prim } } }, prim)
        })
    }





}