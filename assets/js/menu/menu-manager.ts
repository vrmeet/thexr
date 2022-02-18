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
    public scene: BABYLON.Scene
    public plane: BABYLON.Mesh
    public texture1: GUI.AdvancedDynamicTexture
    public texture2: GUI.AdvancedDynamicTexture
    public currentMenu;
    constructor(public sceneManager: SceneManager) {

        this.scene = this.sceneManager.scene
        console.log('the menu manager sasy scene is', this.scene)
        this.texture1 = GUI.AdvancedDynamicTexture.CreateFullscreenUI('ui')



        this.plane = BABYLON.MeshBuilder.CreatePlane("plane_for_box_maker_menu", { height: 0.5, width: 0.5 }, this.scene)
        this.plane.position.y = 0.1
        this.plane.showBoundingBox = true
        this.plane.position.x = 0.2
        this.plane.position.z = 1


        this.texture2 = GUI.AdvancedDynamicTexture.CreateForMesh(this.plane)
        // // // this.texture.hasAlpha = true
        this.plane.parent = this.scene.activeCamera


        listen("open_menu").subscribe(msg => {
            if (!msg.payload.target || !this[msg.payload.target]) {
                console.error("Undefined menu link target", msg.payload)
                return
            }
            this.texture1.rootContainer.dispose()
            let fsc = new GUI.Container()
            fsc.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
            fsc.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
            fsc.width = 0.3
            fsc.height = 0.5
            fsc.addControl(this[msg.payload.target]())
            this.texture1.addControl(fsc)
            this.texture1.idealWidth = 2000


            this.texture2.rootContainer.dispose()
            this.texture2.idealWidth = 500
            this.texture2.addControl(this[msg.payload.target]())
        })

        signalHub.next({ event: "open_menu", payload: { target: "main" } });
    }

    about() {
        return new MenuPageAbout()
    }

    main() {
        console.log('sending main page main', this.scene)
        return new MenuPageMain(this.scene)
    }

    edit() {
        return new MenuPageEdit()
    }

    transform() {
        return new MenuPageTransform(this.sceneManager.scene)
    }


}