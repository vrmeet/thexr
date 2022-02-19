import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import type { SceneManager } from '../sceneManager'
import { signalHub, listen } from "../signalHub";

import { filter } from 'rxjs/operators'
import { MenuPageAbout } from './pages/about'
import { MenuPageMain } from './pages/main'
import { MenuPageEdit } from './pages/edit'
import { MenuPageTransform } from './pages/edit/transform';
import { div, button } from './helpers';

export class MenuManager {
    public scene: BABYLON.Scene
    public plane: BABYLON.Mesh
    public texture: GUI.AdvancedDynamicTexture
    public currentMenu;
    constructor(public sceneManager: SceneManager) {

        this.scene = this.sceneManager.scene
        console.log('the menu manager sasy scene is', this.scene)
        /* controller_ready {hand: 'left'} */

        listen("controller_ready").pipe(
            filter(msg => (msg.payload.hand === 'left'))
        ).subscribe(() => {
            //  console.log('left grip', this.sceneManager.xrManager.left_input_source.grip)
            this.createVRMenuOverlay()

        })

        listen("close_menu").subscribe(() => {
            if (this.texture) {
                this.texture.dispose()
                this.texture = null;
            }
        })



        listen("open_menu").subscribe(msg => {
            if (!msg.payload.target || !this[msg.payload.target]) {
                console.error("Undefined menu link target", msg.payload)
                return
            }
            if (!this.texture) {
                this.createTexture()
            }
            const newContent = this[msg.payload.target]()
            this.applyContent(newContent)


        })


    }


    createVRMenuOverlay() {
        let overlayPlane = BABYLON.MeshBuilder.CreatePlane("plane_for_vr_menu", { height: 0.2, width: 0.2 }, this.scene)
        overlayPlane.position.y = 0.1
        overlayPlane.position.z = 0.2
        overlayPlane.showBoundingBox = true
        overlayPlane.parent = this.sceneManager.xrManager.left_input_source.grip
        let vrTexture = GUI.AdvancedDynamicTexture.CreateForMesh(overlayPlane)
        const control = div({
            name: "vrMenu"
        },
            button({ name: "vrOpenMenu" }, "Menu"),
            button({ name: "vrAudioPublish" }, "Unmute")
        )
        vrTexture.addControl(control)

    }

    applyContent(newContent: GUI.Container) {
        this.texture.rootContainer.dispose()
        if (this.sceneManager.xrManager.inXR) {
            this.texture.idealWidth = 500
            this.texture.addControl(newContent)
        } else {
            let fsc = new GUI.Container()
            fsc.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
            fsc.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
            fsc.width = 0.3
            fsc.height = 0.5
            fsc.addControl(newContent)
            this.texture.addControl(fsc)
            this.texture.idealWidth = 2000
        }
    }

    createMeshTexture() {
        if (!this.plane) {
            this.plane = BABYLON.MeshBuilder.CreatePlane("plane_for_box_maker_menu", { height: 0.5, width: 0.5 }, this.scene)
            this.plane.position.y = 0.1
            this.plane.showBoundingBox = true
            // this.plane.position.x = 0.2
            this.plane.position.z = 0.2
        }
        this.texture = GUI.AdvancedDynamicTexture.CreateForMesh(this.plane)

    }

    createFullScreenUI() {
        this.texture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('ui')
        //  this.texture.rootContainer.isVisible = false

    }

    createTexture() {
        if (this.sceneManager.xrManager.inXR) {
            this.createMeshTexture()
        } else {
            this.createFullScreenUI()
        }

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