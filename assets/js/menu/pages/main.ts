import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

import '../helpers'
import { g, a } from '../helpers';

export class MenuPageMain extends GUI.Container {
    constructor() {
        super()

        let rectProps = {

            cornerRadius: 20,
            color: "Purple",
            thickness: 4,
            background: "gray",
        }

        this.addControl(g(GUI.Rectangle, rectProps,
            "Main Menu",
            a({ target: "about" }, "About"),
            a({ target: "edit" }, "Edit")
        ))
    }

}