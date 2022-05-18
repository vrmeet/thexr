import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { signalHub } from '../../signalHub';

import '../helpers'
import { div, a } from '../helpers';

export class MenuPageSpawner extends GUI.Container {
    constructor() {
        super()
        const callback = () => {
            signalHub.menu.emit("menu_topic", "main")
        }


        this.addControl(
            div({ name: "spawner_div" },
                a({ name: "back_to_main", callback }, "< Back"),
                a({
                    name: "spawn_target_btn", callback: () => {
                        console.log("button clicked")

                    }
                }, "spawn targets")

            )
        )
    }


}