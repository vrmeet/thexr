import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import type { SceneManager } from '../sceneManager'
import { signalHub } from "../signalHub";

import { filter, map, mergeAll } from 'rxjs/operators'
import { MenuPageAbout } from './pages/about'
import { MenuPageMain } from './pages/main'
import { MenuPagePrimitives } from './pages/primitives'
import { MenuPageLogs } from './pages/logs'

import { div, button, a } from './helpers';
import type { Orchestrator } from '../orchestrator';
import { combineLatest, merge } from 'rxjs';

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

    constructor(public orchestrator: Orchestrator) {
        this.sceneManager = orchestrator.sceneManager
        this.scene = orchestrator.sceneManager.scene

        signalHub.local.on('camera_ready').subscribe(() => {
            this.createFullScreenUI()
        })

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
        const mic_muted_pref = signalHub.observables.mic_muted_pref
        const menu_opened = signalHub.observables.menu_opened
        const menu_page = signalHub.observables.menu_page

        combineLatest([mic_muted_pref, menu_opened, menu_page]).subscribe(value => {
            this.render(this.stateToCtrls())
        })
    }


    createVRMenuOverlay() {
        this.wristPlane = BABYLON.MeshBuilder.CreatePlane("wrist_plane", { height: 0.1, width: 0.1 }, this.scene)
        this.wristPlane.showBoundingBox = true
        // this.wristPlane.position.z = 0.1
        // this.wristPlane.position.x = 0.05
        this.wristPlane.position.y = 0.05
        this.wristPlane.rotation.x = 1


        this.wristPlane.parent = this.sceneManager.xrManager.left_input_source.grip
        this.wristGui = GUI.AdvancedDynamicTexture.CreateForMesh(this.wristPlane, 256, 256)

        this.browsePlane = BABYLON.MeshBuilder.CreatePlane("browse_plane", { height: 1, width: 1 }, this.scene)
        this.browsePlane.showBoundingBox = true
        this.browsePlane.position.z = 0.6
        this.browsePlane.position.y = 0.2
        this.browsePlane.rotation.x = 1.06
        this.browsePlane.parent = this.sceneManager.xrManager.left_input_source.grip

        this.browseGui = GUI.AdvancedDynamicTexture.CreateForMesh(this.browsePlane, 640, 640)

        this.render(this.stateToCtrls())

    }

    createFullScreenUI() {
        this.fsGui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("fsGui")
        this.render(this.stateToCtrls())
    }

    render(content: { menuCtrl: GUI.Container, browserCtrl: GUI.Container }) {
        if (this.fsGui) {
            this.fsGui.rootContainer.dispose()

            this.fsGui.addControl(this.adaptMenuCtrlForFsGUI(content.menuCtrl))
            if (signalHub.observables.menu_opened.getValue()) {
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
                if (signalHub.observables.menu_opened.getValue()) {
                    this.browseGui.addControl(content.browserCtrl)
                }
            }
        }
    }

    adaptBrowserCtrlForFsGUI(browserCtrl: GUI.Container) {
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

    adaptMenuCtrlForFsGUI(menuCtrl: GUI.Container) {
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

        const browserCtrl = (signalHub.observables.menu_opened.getValue()) ? this[signalHub.observables.menu_page.getValue()]() : null

        return {
            menuCtrl: this.stateToMenuCtrl(),
            browserCtrl
        }
    }

    stateToMenuCtrl() {
        const menuCallback = () => {
            const newValue = !signalHub.observables.menu_opened.getValue()
            signalHub.observables.menu_opened.next(newValue)
        }

        const micCallback = () => {
            const newValue = !signalHub.observables.mic_muted_pref.getValue()
            signalHub.observables.mic_muted_pref.next(newValue)
        }

        const menuLabel = signalHub.observables.menu_opened.getValue() ? "close" : "menu"
        const micLabel = signalHub.observables.mic_muted_pref.getValue() ? "Unmute" : "Mute"
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
        return new MenuPageLogs(this.orchestrator.logManager)
    }

    primitives() {
        return new MenuPagePrimitives(this.orchestrator)
    }
}


