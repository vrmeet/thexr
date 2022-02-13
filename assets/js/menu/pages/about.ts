import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

import '../helpers'
import { g, a } from '../helpers';

export class MenuPageAbout {
    public texture: GUI.AdvancedDynamicTexture
    constructor(public name: string) {
        this.texture = GUI.AdvancedDynamicTexture.CreateFullscreenUI(name);
        this.texture.addControl(this.template())
    }

    template() {
        return g(GUI.Rectangle, {},
            a({ target: "main" }, "< Back"),
            "Hello About Me")
    }

    dispose() {
        this.texture.dispose()
    }
}