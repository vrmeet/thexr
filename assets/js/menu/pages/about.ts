import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { signalHub } from '../../signalHub';

import '../helpers'
import { div, g, a } from '../helpers';

export class MenuPageAbout extends GUI.Container {
    constructor() {
        super()
        const callback = () => { signalHub.emit('menu_action', { name: "goto_main" }) }

        this.addControl(div({ name: "about_div" },
            a({ name: "back_to_main", callback }, "< Back"),
            "Hello About Me"))
    }


}