import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

import '../helpers'
import { g, a } from '../helpers';

export class MenuPageEdit extends GUI.Container {
    constructor() {
        super()
        this.addControl(g(GUI.Rectangle, {},
            a({ target: "main" }, "< Back"),
            a({ target: "transform" }, "Transform"),
            "Primatives",
            "Color"
        ))
    }


}