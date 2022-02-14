import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

import '../helpers'
import { g, a } from '../helpers';

export class MenuPageMain extends GUI.Container {
    constructor() {
        super()
        this.addControl(g(GUI.Rectangle, {},
            "Main Menu",
            a({ target: "about" }, "About"),
            a({ target: "edit" }, "Edit")
        ))
    }

}