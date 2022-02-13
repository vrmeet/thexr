import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

import '../helpers'
import { g, a } from '../helpers';

export class MenuPageMain {
    public texture: GUI.AdvancedDynamicTexture
    constructor(public name: string) {
        this.texture = GUI.AdvancedDynamicTexture.CreateFullscreenUI(name);
        this.texture.addControl(this.template())
    }

    template() {
        return g(GUI.Rectangle, {},
            "Main Menu",
            a({ target: "about" }, "About"),
            a({ target: "edit" }, "Edit")
        )
    }

    dispose() {
        this.texture.dispose()
    }
}