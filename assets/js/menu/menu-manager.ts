import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import type { SceneManager } from '../sceneManager'
import { signalHub } from "../signalHub";

import { filter, map, mergeAll } from 'rxjs/operators'
import { MenuPageAbout } from './pages/about'
import { MenuPageMain } from './pages/main'
import { MenuPagePrimitives } from './pages/primitives'
import { MenuPageLogs } from './pages/logs'

import { div, a } from './helpers';
import type { Orchestrator } from '../orchestrator';
import { MenuTools } from './pages/tools';
import { MenuColor } from './pages/color';


import { CollaborativeEditTransformManager } from "../collab-edit/transform";
import { CollabEditDeleteManager } from "../collab-edit/delete";
import { MenuPageSpawner } from './pages/spawner';

/*
inline -mode
  - 1 fullscreen gui  
  (create when)
    camera is ready
    exiting VR
  (remove when entering VR)

immersive-mode
   - 1 texture for menu
   - 1 texture for browsing
   (create when entering VR)
   (remove when exiting VR)

menuOpen: true | false
muted: true | false
content: .... (click )


*/


export class MenuManager {
    public fsGui: GUI.AdvancedDynamicTexture
    public wristPlane: BABYLON.AbstractMesh
    public browsePlane: BABYLON.AbstractMesh
    public wristGui: GUI.AdvancedDynamicTexture
    public browseGui: GUI.AdvancedDynamicTexture
    public scene: BABYLON.Scene
    public sceneManager: SceneManager
    public menu_opened: boolean
    public menu_topic: string
    public collabEditManager: CollaborativeEditTransformManager
    public collabDeleteManager: CollabEditDeleteManager

    constructor(public orchestrator: Orchestrator) {
        this.sceneManager = orchestrator.sceneManager
        this.scene = orchestrator.sceneManager.scene
        this.collabEditManager = new CollaborativeEditTransformManager(this.scene)
        this.collabDeleteManager = new CollabEditDeleteManager(this.scene)
        this.menu_opened = false
        this.menu_topic = "main"

        // signalHub.local.on('camera_ready').subscribe(() => {
        this.createFullScreenUI()
        // })

        signalHub.local.on('controller_ready').pipe(
            filter(payload => (payload.hand === 'left'))
        ).subscribe(() => {
            this.createVRMenuOverlay()
        })

        signalHub.local.on('xr_state_changed').subscribe(state => {
            switch (state) {
                case BABYLON.WebXRState.EXITING_XR:
                    // tear down plane and advanced gui textures
                    this.browsePlane.dispose()
                    this.wristPlane.dispose()
                    this.wristGui.dispose()
                    this.browseGui.dispose()
                    this.browsePlane = null
                    this.wristPlane = null;
                    this.wristGui = null;
                    this.browseGui = null;
                    // recreate fullscreen gui
                    this.createFullScreenUI()
                    break;
                case BABYLON.WebXRState.ENTERING_XR:
                    //tear down full screen gui    
                    this.fsGui.dispose();
                    this.fsGui = null;
                    break;
            }
        })

        // listen to menu states

        const menu_opened = signalHub.menu.on("menu_opened").subscribe(value => {
            this.menu_opened = value
            if (this.browsePlane) {

                this.browsePlane.setEnabled(value)
            }
            this.render()
        })

        const menu_topic = signalHub.menu.on("menu_topic").subscribe(topic => {
            this.menu_topic = topic
            this.render()
        })

        // combineLatest([menu_opened, menu_topic]).subscribe(value => {
        //     this.render()
        // })
    }


    createVRMenuOverlay() {
        const utilLayer = BABYLON.UtilityLayerRenderer.DefaultUtilityLayer

        this.wristPlane = BABYLON.MeshBuilder.CreatePlane("wrist_plane", { height: 0.1, width: 0.1 }, this.scene)
        this.wristPlane.showBoundingBox = true
        // this.wristPlane.position.z = 0.1
        // this.wristPlane.position.x = 0.05
        this.wristPlane.position.y = 0.05
        this.wristPlane.rotation.x = BABYLON.Angle.FromDegrees(60).radians()


        this.wristPlane.parent = this.sceneManager.xrManager.left_input_source.grip
        this.wristGui = GUI.AdvancedDynamicTexture.CreateForMesh(this.wristPlane, 256, 256)

        this.browsePlane = BABYLON.MeshBuilder.CreatePlane("browse_plane", { height: 0.5, width: 0.5 }, this.scene)
        this.browsePlane.showBoundingBox = true
        this.browsePlane.setEnabled(false)

        this.browsePlane.position = new BABYLON.Vector3(0.3, 0.02, 0.4)
        this.browsePlane.rotation.x = BABYLON.Angle.FromDegrees(60).radians()

        //  this.browsePlane.position.z = 0.5
        //  this.browsePlane.position.y = -0.3
        //   this.browsePlane.rotation.y = BABYLON.Angle.FromDegrees(-60).radians()
        //  this.browsePlane.rotation.x = BABYLON.Angle.FromDegrees(45).radians()

        this.browsePlane.parent = this.sceneManager.xrManager.left_input_source.grip

        this.browseGui = GUI.AdvancedDynamicTexture.CreateForMesh(this.browsePlane, 640, 640)

        this.render()

    }

    createFullScreenUI() {
        this.fsGui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("fsGui")
        this.render()
    }

    render() {
        const content = this.stateToCtrls()
        if (this.fsGui) {
            this.fsGui.rootContainer.dispose()

            this.fsGui.addControl(this.adaptMenuCtrlForFsGUI(content.menuCtrl))
            if (this.menu_opened) {
                this.fsGui.addControl(this.adaptBrowserCtrlForFsGUI(content.browserCtrl))
            }
        }
        if (this.sceneManager.xrManager.inXR) {
            if (this.wristGui) {
                this.wristGui.rootContainer.dispose()
                this.wristGui.addControl(content.menuCtrl)
            }
            if (this.browseGui) {
                this.browseGui.rootContainer.dispose()
                if (this.menu_opened) {
                    this.browseGui.addControl(content.browserCtrl)
                }
            }
        }
    }

    adaptBrowserCtrlForFsGUI(browserCtrl: GUI.Control) {
        let fsc = new GUI.Container("adapted-browse")
        fsc.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
        fsc.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
        fsc.left = "120px"
        fsc.paddingBottom = "50px"
        fsc.width = "500px"
        fsc.height = "300px"
        fsc.addControl(browserCtrl)
        fsc.zIndex = 10;
        return fsc
    }

    adaptMenuCtrlForFsGUI(menuCtrl: GUI.Control) {
        let fsc = new GUI.Container("adapted-menu")
        fsc.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
        fsc.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
        fsc.width = "100px"
        fsc.height = "100px"
        fsc.addControl(menuCtrl)
        fsc.zIndex = 20;
        return fsc
    }

    stateToCtrls() {

        const browserCtrl = (this.menu_opened) ? this[this.menu_topic]() : null

        return {
            menuCtrl: this.stateToMenuCtrl(),
            browserCtrl
        }
    }

    stateToMenuCtrl() {
        const menuCallback = () => {
            const newValue = !this.menu_opened
            signalHub.menu.emit("menu_opened", newValue)
        }

        const micCallback = () => {

            const newValue: boolean = !this.orchestrator.memberStates.my_mic_muted_pref()
            this.orchestrator.memberStates.update_my_mic_muted_pref(newValue)

            this.render()
            // !signalHub.observables.mic_muted_pref.getValue()
            //signalHub.observables.mic_muted_pref.next(newValue)
        }

        const menuLabel = this.menu_opened ? "close" : "menu"
        const micLabel = this.orchestrator.memberStates.my_mic_muted_pref() ? "Unmute" : "Mute"
        return div({ name: 'menu-div' },
            a({ name: 'menu-btn', callback: menuCallback }, menuLabel),
            a({ name: 'mute-btn', callback: micCallback }, micLabel),
        )
    }


    // browsing functions

    main() {
        return new MenuPageMain(this.scene)
    }

    about() {
        return new MenuPageAbout()
    }

    logs() {
        return new MenuPageLogs()
    }

    tools() {
        return new MenuTools()
    }

    color() {
        return new MenuColor(this.orchestrator)
    }

    primitives() {
        return new MenuPagePrimitives(this.orchestrator)
    }

    spawner() {
        return new MenuPageSpawner()
    }
}


