import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import type { SceneManager } from '../sceneManager'
import { signalHub } from "../signalHub";

import { filter } from 'rxjs/operators'
import { MenuPageAbout } from './pages/about'
import { MenuPageMain } from './pages/main'
import { MenuPagePrimitives } from './pages/primitives'
import { MenuPageLogs } from './pages/logs'

import { div, button, a } from './helpers';
import type { Orchestrator } from '../orchestrator';

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

export type stateType = {
    menuOpened: boolean
    menuLabel: "Menu" | "Close Menu"
    mic: "on" | "off"
    micLabel: "Unmute" | "Mute" | "..."
    editing: boolean
    browsing: string
}

export class MenuManager {
    public state: stateType
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
        this.state = {
            menuOpened: false,
            menuLabel: "Menu",
            mic: "off",
            micLabel: "Unmute",
            editing: false,
            browsing: "main"
        }
        signalHub.on('camera_ready').subscribe(() => {
            this.createFullScreenUI()
        })

        // listen("camera_ready").subscribe(() => {
        //     this.createFullScreenUI()
        // })

        signalHub.on('controller_ready').pipe(
            filter(payload => (payload.hand === 'left'))
        ).subscribe(() => {
            this.createVRMenuOverlay()
        })

        signalHub.on('xr_state_changed').subscribe(state => {
            switch (state) {
                case BABYLON.WebXRState.EXITING_XR:
                    // this.state = { ... this.state, menu_opened: false, editing: false }

                    this.browsePlane.dispose()
                    this.wristPlane.dispose()
                    this.wristGui.dispose()
                    this.browseGui.dispose()
                    this.browsePlane = null
                    this.wristPlane = null;
                    this.wristGui = null;
                    this.browseGui = null;
                    this.createFullScreenUI()
                    break;
                case BABYLON.WebXRState.ENTERING_XR:
                    //  this.state = { ... this.state, menu_opened: false, editing: false }
                    this.fsGui.dispose();
                    this.fsGui = null;
                    break;
            }
        })

        signalHub.on('editing').subscribe(value => {
            this.state.editing = value
            this.render(this.stateToCtrls())
        })

        signalHub.on('mic').subscribe(value => {
            this.state.micLabel = '...'
            this.state.mic = value
            this.render(this.stateToCtrls())
        })

        signalHub.on('menu_action').subscribe(msg => {
            let menuCtrl: GUI.Container
            let browserCtrl: GUI.Container
            // update state
            console.log('receiving menu_action', JSON.stringify(msg))
            switch (msg.name) {
                case "close_menu":
                    this.state = { ...this.state, menuOpened: false, menuLabel: "Menu" }
                    break;
                case "open_menu":
                    this.state = { ...this.state, menuOpened: true, menuLabel: "Close Menu" }
                    break;
                case "goto_about":
                    this.state = { ... this.state, browsing: "about" }
                    break;
                case "goto_main":
                    this.state = { ...this.state, browsing: "main" }
                    break;
                case "goto_logs":
                    this.state = { ... this.state, browsing: "logs" }
                    break;
                case "goto_primitives":
                    this.state = { ...this.state, browsing: "primitives" }
                    break;
                case "create_primitive":
                    signalHub.emit('spaces_api', { func: "add_entity_with_broadcast", args: [msg.payload.type] })
                    break;
                // case "unmute":
                //     this.orchestrator.webRTCClient.publishAudio()
                //     this.state = { ...this.state, muted: false }
                //     break;
                // case "mute":
                //     this.orchestrator.webRTCClient.unpublishAudio()
                //     this.state = { ...this.state, muted: true }
                //     break;
                default:
                    console.warn('no such action handler', JSON.stringify(msg))
            }

            this.render(this.stateToCtrls())
        })
    }


    createVRMenuOverlay() {
        this.wristPlane = BABYLON.MeshBuilder.CreatePlane("wrist_plane", { height: 0.1, width: 0.1 }, this.scene)
        BABYLON.Tags.AddTagsTo(this.wristPlane, "vr_menu_gui")
        this.wristPlane.showBoundingBox = true
        this.wristPlane.position.z = 0.05
        this.wristPlane.position.x = 0.05
        this.wristPlane.position.y = 0.08


        this.wristPlane.parent = this.sceneManager.xrManager.left_input_source.grip
        this.wristGui = GUI.AdvancedDynamicTexture.CreateForMesh(this.wristPlane, 256, 256)

        this.browsePlane = BABYLON.MeshBuilder.CreatePlane("browse_plane", { height: 1, width: 1 }, this.scene)
        BABYLON.Tags.AddTagsTo(this.browsePlane, "vr_menu_gui")
        this.browsePlane.showBoundingBox = true
        this.browsePlane.position.z = 0.1
        this.browsePlane.position.y = 0.2
        this.browsePlane.parent = this.sceneManager.xrManager.left_input_source.grip
        BABYLON.Tags.AddTagsTo(this.browsePlane.parent, "vr_menu_gui")

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
            if (this.state.menuOpened) {
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
                if (this.state.menuOpened) {
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

        const browserCtrl = (this.state.menuOpened) ? this[this.state.browsing]() : null

        return {
            menuCtrl: this.stateToMenuCtrl(),
            browserCtrl
        }
    }

    stateToMenuCtrl() {
        let menuCallback, micCallback;

        if (this.state.menuOpened) {
            menuCallback = () => { signalHub.emit('menu_action', { name: 'close_menu' }) }

        } else {
            menuCallback = () => { signalHub.emit('menu_action', { name: 'open_menu' }) }
        }
        if (this.state.mic == "off") {
            micCallback = () => { signalHub.emit('mic', "on"); }
        } else {
            micCallback = () => { signalHub.emit('mic', "off"); }
        }

        return div({ name: 'menu-div' },
            a({ name: 'menu-btn', callback: menuCallback }, this.state.menuLabel),
            a({ name: 'mute-btn', callback: micCallback }, this.state.micLabel),
        )
    }


    // browsing functions

    main() {
        return new MenuPageMain(this.scene, this.state)
    }

    about() {
        return new MenuPageAbout()
    }

    logs() {
        return new MenuPageLogs(this.orchestrator.logManager)
    }

    primitives() {
        return new MenuPagePrimitives()
    }
}


