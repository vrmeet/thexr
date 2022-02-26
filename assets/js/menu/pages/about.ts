import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

import '../helpers'
import { div, g, a } from '../helpers';

export class MenuPageAbout extends GUI.Container {
    constructor() {
        super()
        this.addControl(div({ name: "about_div" },
            a({ menu_action: { name: "goto_main" } }, "< Back"),
            "Hello About Me"))
    }


}