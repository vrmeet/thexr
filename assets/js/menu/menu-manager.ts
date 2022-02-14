import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import type { SceneManager } from '../sceneManager'
import { signalHub, listen } from "../signalHub";

import { filter } from 'rxjs/operators'
import { MenuPageAbout } from './pages/about'
import { MenuPageMain } from './pages/main'
import { MenuPageEdit } from './pages/edit'
import { MenuPageTransform } from './pages/edit/transform';

export class MenuManager {
    public plane: BABYLON.Mesh
    public texture: GUI.AdvancedDynamicTexture
    public currentMenu;
    constructor(public sceneManager: SceneManager, public scene: BABYLON.Scene) {

        this.plane = BABYLON.MeshBuilder.CreatePlane("plane_for_box_maker_menu", { height: 0.3, width: 0.5 }, this.sceneManager.scene)
        //this.plane = Mesh.CreatePlane("plane_for_box_maker_menu", 0.3, this.scene)
        this.plane.position.z = 0.3
        this.plane.position.y = 2

        this.plane.showBoundingBox = true

        this.texture = GUI.AdvancedDynamicTexture.CreateForMesh(this.plane)
        this.texture.hasAlpha = true


        listen("open_menu").subscribe(msg => {
            if (!msg.payload.target || !this[msg.payload.target]) {
                console.error("Undefined menu link target", msg.payload)
                return
            }
            this.texture.rootContainer.dispose()
            this.texture.addControl(this[msg.payload.target]())
        })
    }

    about() {
        return new MenuPageAbout()
    }

    main() {
        return new MenuPageMain()
    }

    edit() {
        return new MenuPageEdit()
    }

    transform() {
        return new MenuPageTransform(this.sceneManager.scene)
    }


}