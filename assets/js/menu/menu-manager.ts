import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";

import { signalHub } from "../signalHub";

import { filter, take, map, mergeAll, takeUntil } from "rxjs/operators";
import { MenuPageAbout } from "./pages/about";
import { MenuPageMain } from "./pages/main";
import { MenuPagePrimitives } from "./pages/primitives";
import { MenuPageLogs } from "./pages/logs";

import { div, a } from "./helpers";
import { MenuTools } from "./pages/tools";
import { MenuColor } from "./pages/color";

import { CollaborativeEditTransformManager } from "../collab-edit/transform";
import { CollabEditDeleteManager } from "../collab-edit/delete";
import { MenuPageSpawner } from "./pages/spawner";
import type { XRManager } from "../xr/xr-manager";
import type { member_state } from "../types";
import { Observable } from "rxjs";
import type { Vector2WithInfo } from "babylonjs-gui";
import { BarrierMaker } from "./pages/barrier-maker";
import { GameConstructs } from "./pages/game-constructs";
import { mode } from "../mode";
import { CollabEditDupManager } from "../collab-edit/dup";
import { isMobile } from "../utils/utils-browser";

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
  public fsGui: GUI.AdvancedDynamicTexture;
  public wristPlane: BABYLON.AbstractMesh;
  public browsePlane: BABYLON.AbstractMesh;
  public wristGui: GUI.AdvancedDynamicTexture;
  public browseGui: GUI.AdvancedDynamicTexture;
  public menu_topic: string;
  public collabEditManager: CollaborativeEditTransformManager;
  public collabDupManager: CollabEditDupManager;
  public collabDeleteManager: CollabEditDeleteManager;
  public myState: member_state;

  constructor(public scene: BABYLON.Scene, public xrManager: XRManager) {
    this.collabEditManager = new CollaborativeEditTransformManager(this.scene);
    this.collabDeleteManager = new CollabEditDeleteManager(this.scene);
    this.collabDupManager = new CollabEditDupManager(this.scene);
    this.menu_topic = "main";

    signalHub.local.on("my_state").subscribe(state => {
      this.myState = state;
      this.render();
    });

    signalHub.local
      .on("client_ready")
      .pipe(take(1))
      .subscribe(() => {
        this.createFullScreenUI();
      });

    // signalHub.local.on('camera_ready').subscribe(() => {

    // })

    signalHub.local
      .on("controller_ready")
      .pipe(filter(payload => payload.hand === "left"))
      .subscribe(() => {
        this.createVRMenuOverlay();
      });

    signalHub.local.on("xr_state_changed").subscribe(state => {
      switch (state) {
        case BABYLON.WebXRState.EXITING_XR:
          // tear down plane and advanced gui textures
          this.browsePlane?.dispose();
          this.wristPlane?.dispose();
          this.wristGui?.dispose();
          this.browseGui?.dispose();
          this.browsePlane = null;
          this.wristPlane = null;
          this.wristGui = null;
          this.browseGui = null;
          // recreate fullscreen gui
          this.createFullScreenUI();
          break;
        case BABYLON.WebXRState.ENTERING_XR:
          //tear down full screen gui
          this.fsGui.dispose();
          this.fsGui = null;
          break;
      }
    });

    const menu_topic = signalHub.menu.on("menu_topic").subscribe(topic => {
      this.menu_topic = topic;
      this.render();
    });
  }

  createVRMenuOverlay() {
    // the utilitiy layer doesn't draw the laser point on it
    // const utilLayer = BABYLON.UtilityLayerRenderer.DefaultUtilityLayer

    this.wristPlane = BABYLON.MeshBuilder.CreatePlane(
      "wrist_plane",
      { height: 0.1, width: 0.1 },
      this.scene
    );
    this.wristPlane.showBoundingBox = true;
    // this.wristPlane.position.z = 0.1
    // this.wristPlane.position.x = 0.05
    this.wristPlane.position.y = 0.05;
    this.wristPlane.rotation.x = BABYLON.Angle.FromDegrees(60).radians();

    this.wristPlane.parent = this.xrManager.left_input_source.grip;
    this.wristGui = GUI.AdvancedDynamicTexture.CreateForMesh(
      this.wristPlane,
      256,
      256
    );

    this.browsePlane = BABYLON.MeshBuilder.CreatePlane(
      "browse_plane",
      { height: 0.5, width: 0.5 },
      this.scene
    );
    this.browsePlane.metadata = { menu: true };
    this.browsePlane.showBoundingBox = true;
    this.browsePlane.setEnabled(false);

    this.browsePlane.position = new BABYLON.Vector3(0.3, 0.02, 0.4);
    this.browsePlane.rotation.x = BABYLON.Angle.FromDegrees(60).radians();

    //  this.browsePlane.position.z = 0.5
    //  this.browsePlane.position.y = -0.3
    //   this.browsePlane.rotation.y = BABYLON.Angle.FromDegrees(-60).radians()
    //  this.browsePlane.rotation.x = BABYLON.Angle.FromDegrees(45).radians()

    this.browsePlane.parent = this.xrManager.left_input_source.grip;

    this.browseGui = GUI.AdvancedDynamicTexture.CreateForMesh(
      this.browsePlane,
      640,
      640
    );

    this.render();
  }

  createFullScreenUI() {
    this.fsGui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("fsGui");

    this.render();
  }

  makeThumbArea(name, thickness, color, background) {
    let ellipse = new GUI.Ellipse();
    ellipse.name = name;
    ellipse.thickness = thickness;
    ellipse.color = color;
    ellipse.background = background;
    ellipse.paddingLeft = "0px";
    ellipse.paddingRight = "0px";
    ellipse.paddingTop = "0px";
    ellipse.paddingBottom = "0px";

    return ellipse;
  }

  makeContainerObservable(container: GUI.Container, observableName: string) {
    return new Observable<Vector2WithInfo>(subscriber => {
      let babylonObs = container[
        observableName
      ] as BABYLON.Observable<Vector2WithInfo>;
      const obs = babylonObs.add(value => subscriber.next(value));

      return () => {
        container[observableName].remove(obs);
      };
    });
  }

  makeRegisterBeforeRenderObservable(scene: BABYLON.Scene) {
    return new Observable<any>(subscriber => {
      let obs = scene.onBeforeRenderObservable.add(value =>
        subscriber.next(value)
      );

      return () => {
        scene.onBeforeRenderObservable.remove(obs);
      };
    });
  }

  makeJoyStick() {
    const SIDE_JOYSTICK_OFFSET = 150;
    const BOTTOM_JOYSTICK_OFFSET = -50;

    let leftThumbContainer = this.makeThumbArea("leftThumb", 2, "blue", null);
    leftThumbContainer.height = "200px";
    leftThumbContainer.width = "200px";
    leftThumbContainer.isPointerBlocker = true;
    leftThumbContainer.horizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftThumbContainer.verticalAlignment =
      GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    leftThumbContainer.alpha = 0.4;
    leftThumbContainer.left = SIDE_JOYSTICK_OFFSET;
    leftThumbContainer.top = BOTTOM_JOYSTICK_OFFSET;

    let leftInnerThumbContainer = this.makeThumbArea(
      "leftInnterThumb",
      4,
      "blue",
      null
    );
    leftInnerThumbContainer.height = "80px";
    leftInnerThumbContainer.width = "80px";
    leftInnerThumbContainer.isPointerBlocker = true;
    leftInnerThumbContainer.horizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    leftInnerThumbContainer.verticalAlignment =
      GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    let leftPuck = this.makeThumbArea("leftPuck", 0, "blue", "blue");
    leftPuck.height = "60px";
    leftPuck.width = "60px";
    leftPuck.isPointerBlocker = true;
    leftPuck.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    leftPuck.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    let containerPointerDown$ = this.makeContainerObservable(
      leftThumbContainer,
      "onPointerDownObservable"
    );

    let subscription = containerPointerDown$.subscribe(coordinates => {
      let startTime = Date.now();

      // listen for one pointer UP and unsubscribe
      let containerPointerUp$ = this.makeContainerObservable(
        leftThumbContainer,
        "onPointerUpObservable"
      );
      containerPointerUp$.pipe(take(1)).subscribe(upCoordinates => {
        leftPuck.isVisible = false;
        leftThumbContainer.alpha = 0.4;
        leftPuck.left = 0;
        leftPuck.top = 0;
        const clickSpeed = Date.now() - startTime;
        // signalHub.incoming.emit("hud_msg", `click ${clickSpeed}`)
        // clicking on mobile is slow, this is the value i tested with that works on my iphone
        if (clickSpeed < 125) {
          //console.log("pure click with no drag")
          signalHub.local.emit("trigger_substitute", true);
        }
      });

      // listen for pointer move UNTIL pointer up
      let containerPointerMove$ = this.makeContainerObservable(
        leftThumbContainer,
        "onPointerMoveObservable"
      );
      containerPointerMove$
        .pipe(takeUntil(containerPointerUp$))
        .subscribe(coordinates => {
          leftPuck.left =
            coordinates.x -
            leftThumbContainer._currentMeasure.width * 0.5 -
            SIDE_JOYSTICK_OFFSET;
          leftPuck.top =
            (this.fsGui["_canvas"].height -
              coordinates.y -
              leftThumbContainer._currentMeasure.height * 0.5 +
              BOTTOM_JOYSTICK_OFFSET) *
            -1;
        });

      let renderObs$ = this.makeRegisterBeforeRenderObservable(this.scene);
      renderObs$.pipe(takeUntil(containerPointerUp$)).subscribe(() => {
        let camera = this.scene.activeCamera as BABYLON.FreeCamera;
        let forward = -leftPuck._top.getValue(this.fsGui) / 3000;
        let side = leftPuck._left.getValue(this.fsGui) / 3000;
        let translateTransform = BABYLON.Vector3.TransformCoordinates(
          new BABYLON.Vector3(side, 0, forward),
          BABYLON.Matrix.RotationY(camera.absoluteRotation.toEulerAngles().y)
        );
        camera.cameraDirection.addInPlace(translateTransform);
      });

      leftPuck.isVisible = true;
      leftPuck.left =
        coordinates.x -
        leftThumbContainer._currentMeasure.width * 0.5 -
        SIDE_JOYSTICK_OFFSET;
      leftPuck.top =
        (this.fsGui["_canvas"].height -
          coordinates.y -
          leftThumbContainer._currentMeasure.height * 0.5 +
          BOTTOM_JOYSTICK_OFFSET) *
        -1;
      leftThumbContainer.alpha = 0.9;
    });

    this.fsGui.rootContainer.onDisposeObservable.addOnce(() => {
      subscription.unsubscribe();
    });

    this.fsGui.addControl(leftThumbContainer);
    leftThumbContainer.addControl(leftInnerThumbContainer);
    leftThumbContainer.addControl(leftPuck);
    leftPuck.isVisible = false;
  }

  render() {
    const content = this.stateToCtrls();
    if (this.fsGui) {
      this.fsGui.rootContainer.dispose();
      if (isMobile()) {
        this.makeJoyStick();
      }

      this.fsGui.addControl(this.adaptMenuCtrlForFsGUI(content.menuCtrl));
      if (mode.menu_open) {
        this.fsGui.addControl(
          this.adaptBrowserCtrlForFsGUI(content.browserCtrl)
        );
      }
    }
    if (this.browsePlane) {
      if (this.wristGui) {
        this.wristGui.rootContainer.dispose();
        this.wristGui.addControl(content.menuCtrl);
      }
      if (this.browseGui) {
        this.browseGui.rootContainer.dispose();
        if (mode.menu_open) {
          this.browseGui.addControl(content.browserCtrl);
        }
      }
    }
  }

  adaptBrowserCtrlForFsGUI(browserCtrl: GUI.Control) {
    let fsc = new GUI.Container("adapted-browse");
    fsc.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    fsc.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    fsc.left = "120px";
    fsc.paddingBottom = "50px";
    fsc.width = "500px";
    fsc.height = "300px";
    fsc.addControl(browserCtrl);
    fsc.zIndex = 10;
    return fsc;
  }

  adaptMenuCtrlForFsGUI(menuCtrl: GUI.Control) {
    let fsc = new GUI.Container("adapted-menu");
    fsc.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    fsc.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    fsc.width = "120px";
    fsc.height = "100px";
    fsc.addControl(menuCtrl);
    fsc.zIndex = 20;
    return fsc;
  }

  stateToCtrls() {
    const browserCtrl = mode.menu_open ? this[this.menu_topic]() : null;

    return {
      menuCtrl: this.stateToMenuCtrl(),
      browserCtrl,
    };
  }

  stateToMenuCtrl() {
    const menuCallback = () => {
      mode.menu_open = !mode.menu_open;
      signalHub.menu.emit("menu_opened", mode.menu_open);

      if (this.browsePlane) {
        this.browsePlane.setEnabled(mode.menu_open);
      }
      this.render();
    };

    const micCallback = () => {
      signalHub.menu.emit("toggle_mic", true);
      //this.render()
      // !signalHub.observables.mic_muted_pref.getValue()
      //signalHub.observables.mic_muted_pref.next(newValue)
    };

    const menuLabel = mode.menu_open ? "Close Menu" : "Menu";
    const micLabel = this.myState.mic_muted ? "Unmute" : "Mute";
    return div(
      { name: "menu-div" },
      a({ name: "menu-btn", callback: menuCallback }, menuLabel),
      a({ name: "mute-btn", callback: micCallback }, micLabel)
    );
  }

  // browsing functions

  main() {
    return new MenuPageMain(this.scene);
  }

  about() {
    return new MenuPageAbout();
  }

  logs() {
    return new MenuPageLogs();
  }

  tools() {
    return new MenuTools();
  }

  color() {
    return new MenuColor(this.scene);
  }

  primitives() {
    return new MenuPagePrimitives(this.scene);
  }

  barriermaker() {
    return new BarrierMaker(this.scene);
  }

  gameconstructs() {
    return new GameConstructs(this.scene);
  }

  spawner() {
    return new MenuPageSpawner();
  }
}
