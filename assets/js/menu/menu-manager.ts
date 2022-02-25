import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import type { SceneManager } from '../sceneManager'
import { signalHub, listen } from "../signalHub";

import { filter } from 'rxjs/operators'
import { MenuPageAbout } from './pages/about'
import { MenuPageMain } from './pages/main'
import { MenuPagePrimitives } from './pages/primitives'
import { MenuPageEdit } from './pages/edit'
import { MenuPageTransform } from './pages/edit/transform';
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
    menu_opened: boolean
    muted: boolean
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
            menu_opened: false,
            muted: true,
            editing: false,
            browsing: "main"
        }
        listen("camera_ready").subscribe(() => {
            this.createFullScreenUI()
        })

        listen("controller_ready").pipe(
            filter(msg => (msg.payload.hand === 'left'))
        ).subscribe(() => {
            this.createVRMenuOverlay()
        })

        listen("xr_state_change").subscribe(msg => {
            switch (msg.payload.state) {
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
        listen("menu_action").subscribe(msg => {
            let menuCtrl: GUI.Container
            let browserCtrl: GUI.Container
            if (msg.payload.name) {
                // update state
                switch (msg.payload.name) {
                    case "close_menu":
                        this.state = { ...this.state, menu_opened: false }
                        break;
                    case "open_menu":
                        this.state = { ...this.state, menu_opened: true }
                        break;
                    case "goto_about":
                        this.state = { ... this.state, browsing: "about" }
                        break;
                    case "goto_main":
                        this.state = { ...this.state, browsing: "main" }
                        break;
                    case "goto_primitives":
                        this.state = { ...this.state, browsing: "primitives" }
                        break;
                    case "create_primitive":
                        signalHub.next({
                            event: "spaces_api",
                            payload: { func: "add_entity_with_broadcast", args: [msg.payload.type] },
                        });
                        break;
                    case "unmute":
                        this.orchestrator.webRTCClient.publishAudio()
                        this.state = { ...this.state, muted: false }
                        break;
                    case "mute":
                        this.orchestrator.webRTCClient.publishAudio()
                        this.state = { ...this.state, muted: true }
                        break;
                    default:
                        console.error('no such action handler', JSON.stringify(msg))
                }
            } else {
                console.error('malformed message', JSON.stringify(msg))
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
            if (this.state.menu_opened) {
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
                if (this.state.menu_opened) {
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

        const browserCtrl = (this.state.menu_opened) ? this[this.state.browsing]() : null

        return {
            menuCtrl: this.stateToMenuCtrl(),
            browserCtrl
        }
    }

    stateToMenuCtrl() {
        let toggleMenu;
        let label;
        let muteOrUnmute;
        let muteOrUnmuteLabel;
        if (this.state.menu_opened) {
            toggleMenu = "close_menu"
            label = "Close Menu"
        } else {
            toggleMenu = "open_menu"
            label = "Menu"
        }
        if (this.state.muted) {
            muteOrUnmute = "unmute"
            muteOrUnmuteLabel = "Unmute"
        } else {
            muteOrUnmute = "mute"
            muteOrUnmuteLabel = "Mute"
        }

        return div({ name: 'menu-div' },
            a({ name: 'menu-btn', msg: { event: "menu_action", payload: { name: toggleMenu } } }, label),
            a({ name: 'mute-btn', msg: { event: "menu_action", payload: { name: muteOrUnmute } } }, muteOrUnmuteLabel),
        )
    }


    // browsing functions

    main() {
        return new MenuPageMain(this.scene, this.state)
    }

    about() {
        return new MenuPageAbout()
    }

    primitives() {
        return new MenuPagePrimitives()
    }
}



// export class MenuManager {
//     public scene: BABYLON.Scene
//     public plane: BABYLON.Mesh
//     public txtrBrowser: GUI.AdvancedDynamicTexture
//     public txtrMenu: GUI.AdvancedDynamicTexture
//     public menuOpen: boolean
//     public muted: boolean
//     constructor(public sceneManager: SceneManager) {
//         this.menuOpen = false
//         this.muted = true
//         this.scene = this.sceneManager.scene
//         console.log('the menu manager sasy scene is', this.scene)
//         /* controller_ready {hand: 'left'} */

//         listen("controller_ready").pipe(
//             filter(msg => (msg.payload.hand === 'left'))
//         ).subscribe(() => {
//             //  console.log('left grip', this.sceneManager.xrManager.left_input_source.grip)
//             this.createVRMenuOverlay()

//         })

//         listen("close_menu").subscribe(() => {
//             if (this.texture) {
//                 this.texture.dispose()
//                 this.texture = null;
//             }
//         })



//         listen("open_menu").subscribe(msg => {
//             if (!msg.payload.target || !this[msg.payload.target]) {
//                 console.error("Undefined menu link target", msg.payload)
//                 return
//             }
//             if (!this.texture) {
//                 this.createTexture()
//             }
//             const newContent = this[msg.payload.target]()
//             this.applyContent(newContent)


//         })


//     }


//     createVRMenuOverlay() {
//         let overlayPlane = BABYLON.MeshBuilder.CreatePlane("plane_for_vr_menu", { height: 0.2, width: 0.2 }, this.scene)
//         overlayPlane.position.y = 0.1
//         overlayPlane.position.z = 0.2
//         overlayPlane.showBoundingBox = true
//         overlayPlane.parent = this.sceneManager.xrManager.left_input_source.grip
//         let vrTexture = GUI.AdvancedDynamicTexture.CreateForMesh(overlayPlane)
//         const control = div({
//             name: "vrMenu"
//         },
//             button({ name: "vrOpenMenu" }, "Menu"),
//             button({ name: "vrAudioPublish" }, "Unmute")
//         )
//         vrTexture.addControl(control)

//     }

//     applyContent(newContent: GUI.Container) {
//         this.texture.rootContainer.dispose()
//         if (this.sceneManager.xrManager.inXR) {
//             this.texture.idealWidth = 500
//             this.texture.addControl(newContent)
//         } else {
//             let fsc = new GUI.Container()
//             fsc.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
//             fsc.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
//             fsc.width = 0.3
//             fsc.height = 0.5
//             fsc.addControl(newContent)
//             this.texture.addControl(fsc)
//             this.texture.idealWidth = 2000
//         }
//     }

//     createMeshTexture() {
//         if (!this.plane) {
//             this.plane = BABYLON.MeshBuilder.CreatePlane("plane_for_box_maker_menu", { height: 0.5, width: 0.5 }, this.scene)
//             this.plane.position.y = 0.1
//             this.plane.showBoundingBox = true
//             // this.plane.position.x = 0.2
//             this.plane.position.z = 0.2
//         }
//         this.texture = GUI.AdvancedDynamicTexture.CreateForMesh(this.plane)

//     }

//     createFullScreenUI() {
//         this.texture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('ui')
//         //  this.texture.rootContainer.isVisible = false

//     }

//     createTexture() {
//         if (this.sceneManager.xrManager.inXR) {
//             this.createMeshTexture()
//         } else {
//             this.createFullScreenUI()
//         }

//     }

//     about() {
//         return new MenuPageAbout()
//     }

//     main() {
//         console.log('sending main page main', this.scene)
//         return new MenuPageMain(this.scene)
//     }

//     edit() {
//         return new MenuPageEdit()
//     }

//     transform() {
//         return new MenuPageTransform(this.sceneManager.scene)
//     }


// }