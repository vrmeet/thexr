/// <reference types="svelte" />
import type { Context } from "../../context";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import type { SignalHub } from "../../signalHub";
import { filter, take } from "rxjs";

import MenuBar from "../../svelte/MenuBar.svelte";

export class SystemMenu implements ISystem {
  public name = "system-menu";
  public order = 8;
  public fsGui: GUI.AdvancedDynamicTexture;
  public smallPlane: BABYLON.AbstractMesh;
  public bigPlane: BABYLON.AbstractMesh;
  public wristGui: GUI.AdvancedDynamicTexture;
  public browseGui: GUI.AdvancedDynamicTexture;
  public grip: BABYLON.AbstractMesh;

  public context: Context;
  public signalHub: SignalHub;
  public mode: "vr" | "fs";
  public scene: BABYLON.Scene;

  init(context: Context) {
    this.context = context;
    this.scene = context.scene;
    this.mode = "fs";
    // const engine = this.context.scene.getEngine();
    // crisp text
    // engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

    // const fakeGrip = this.context.BABYLON.MeshBuilder.CreateBox(
    //   "fakeGrip",
    //   { size: 0.1 },
    //   this.context.scene
    // );
    // fakeGrip.position.y = 1.5;
    // this.grip = fakeGrip;

    this.signalHub = context.signalHub;

    this.signalHub.local
      .on("client_ready")
      .pipe(filter((choice) => choice === "enter"))
      .subscribe(() => {
        // we can't guarantee that we can force a user into VR
        // so always start in fullscreen and allow the enter XR transition to get the XR menu
        this.mode = "fs";
        this.initializeMenu();
      });

    this.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR))
      .subscribe(() => {
        this.mode = "fs";
        this.grip = null;
        this.renderMenuToTexture();
      });

    this.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.ENTERING_XR))
      .subscribe(() => {
        this.mode = "vr";
        // make sure there is something to bind menu to
        this.signalHub.local
          .on("controller_ready")
          .pipe(
            filter((payload) => payload.hand === "left"),
            take(1)
          )
          .subscribe((payload) => {
            this.grip = payload.grip;
            this.prepVRScreenMenuExperience();
            this.renderMenuToTexture();
          });
      });

    /*
   
*/
  }

  buttonFromEl(el: HTMLButtonElement, style: CSSStyleDeclaration) {
    const gui = new GUI.Button(el.id);

    // gui.hoverCursor = "pointer";
    // gui.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    // gui.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

    // gui.isPointerBlocker = true;
    // gui.leftInPixels = el.offsetLeft;
    // gui.topInPixels = el.offsetTop;
    gui.thickness = 0;
    gui.onPointerUpObservable.add(() => {
      el.click();
    });
    const rect = new GUI.Rectangle(`${el.id}_btn_rect`);
    rect.cornerRadius = 5;
    rect.background = style.backgroundColor;
    rect.color = style.backgroundColor;
    const label = new GUI.TextBlock(`${el.id}_btn_txt`);
    label.text = el.innerText;
    label.fontSize = style.fontSize;
    label.fontWeight = "bold";
    label.color = style.color;
    label.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

    rect.addControl(label);
    gui.addControl(rect);
    return gui;
  }

  rectFromEl(el: HTMLDivElement, style: CSSStyleDeclaration) {
    const gui = new GUI.Rectangle(el.id);
    gui.thickness = Number(style.borderWidth.replace("px", ""));

    gui.color = style.borderColor;
    gui.background = style.backgroundColor;
    if (el.children.length === 0 && el.innerText.length > 0) {
      const label = new GUI.TextBlock(`${el.id}_inner_txt`);
      label.text = el.innerText;
      label.fontSize = 12;
      label.color = style.color;
      label.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      gui.addControl(label);
    }
    return gui;
  }

  htmlToGui(el: HTMLElement) {
    let gui: GUI.Container;
    const style = getComputedStyle(el);

    switch (el.nodeName) {
      case "DIV":
        gui = this.rectFromEl(el as HTMLDivElement, style);
        // gui.color = "#ff0000";
        // gui.background = "#aa00ee";
        break;
      case "BUTTON":
        gui = this.buttonFromEl(el as HTMLButtonElement, style);
        break;
      default:
        console.log("node name", el.nodeName);
        gui = new GUI.Container(el.id);
    }

    Object.keys(el.dataset).forEach((key) => {
      gui[key] = el.dataset[key];
    });

    for (let i = 0; i < el.children.length; i++) {
      const childControl = this.htmlToGui(el.children.item(i) as HTMLElement);
      gui.addControl(childControl);
    }

    // set height and width at the end as the last thing you do
    //because adding children into a container seems to
    // set them to % instead of px dimensions
    gui.height = `${el.clientHeight}px`;
    gui.width = `${el.clientWidth}px`;
    gui.hoverCursor = "pointer";
    gui.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    gui.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

    gui.isPointerBlocker = true;
    gui.leftInPixels = el.offsetLeft;
    gui.topInPixels = el.offsetTop;

    return gui;
  }

  initializeMenu() {
    new MenuBar({
      target: document.body,
      props: {
        context: this.context,
        updateCallback: () => {
          this.renderMenuToTexture();
        },
      },
    });
  }

  renderMenuToFullScreen() {
    const menuBarCtrl = this.htmlToGui(document.getElementById("menu_bar"));

    this.prepFullScreenMenuExperience();

    menuBarCtrl.scaleX = 0.5;
    menuBarCtrl.scaleY = 0.5;
    menuBarCtrl.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    menuBarCtrl.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    menuBarCtrl.leftInPixels = 0;
    menuBarCtrl.transformCenterX = 0;
    menuBarCtrl.transformCenterY = 1;

    // menuBarCtrl.widthInPixels = Math.floor(menuBarCtrl.widthInPixels / 2);
    // menuBarCtrl.heightInPixels = Math.floor(menuBarCtrl.heightInPixels / 2);

    // this.fsGui.rootContainer.scaleX = window.devicePixelRatio;
    // this.fsGui.rootContainer.scaleY = window.devicePixelRatio;
    this.fsGui.addControl(menuBarCtrl);
    const elementMenuHome = document.getElementById("menu_home");
    if (elementMenuHome) {
      const menuHome = this.htmlToGui(document.getElementById("menu_home"));
      menuHome.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      menuHome.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      menuHome.topInPixels = 10;
      menuHome.leftInPixels = 0;

      this.fsGui.addControl(menuHome);
    }
  }

  renderMenuToSmallAndLargePlanes() {
    if (!this.grip) {
      return;
    }
    this.prepVRScreenMenuExperience();
    const menuBarCtrl = this.htmlToGui(document.getElementById("menu_bar"));
    menuBarCtrl.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    menuBarCtrl.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    menuBarCtrl.leftInPixels = 0;
    menuBarCtrl.topInPixels = 0;
    this.wristGui.addControl(menuBarCtrl);
    const elementMenuHome = document.getElementById("menu_home");
    if (elementMenuHome) {
      const menuHome = this.htmlToGui(document.getElementById("menu_home"));
      menuHome.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      menuHome.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      menuHome.topInPixels = 10;
      menuHome.leftInPixels = 0;
      this.browseGui.addControl(menuHome);
      this.bigPlane.setEnabled(true);
    } else {
      this.bigPlane.setEnabled(false);
    }
  }

  renderMenuToTexture() {
    if (this.mode === "fs") {
      this.renderMenuToFullScreen();
    } else {
      this.renderMenuToSmallAndLargePlanes();
    }
  }

  tearDownVRMenu() {
    this.wristGui?.dispose();
    this.browseGui?.dispose();
    this.smallPlane?.dispose();
    this.bigPlane?.dispose();
    this.wristGui = null;
    this.browseGui = null;
    this.smallPlane = null;
    this.bigPlane = null;
  }

  tearDownFullScreenMenu() {
    this.fsGui?.dispose();
    this.fsGui = null;
  }

  prepFullScreenMenuExperience() {
    if (this.fsGui?.rootContainer) {
      // already prepped, so just clean so we can reattach controls
      this.fsGui.rootContainer.dispose();
    } else {
      // we were in VR, so dispose of that and create new full screen experience
      this.tearDownVRMenu();
      this.fsGui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("fsGui");
    }
  }

  createSmallPlane() {
    this.smallPlane = BABYLON.MeshBuilder.CreatePlane(
      "small_plane",
      { height: 0.1, width: 0.1 },
      this.scene
    );
    this.smallPlane.showBoundingBox = true;
    // this.smallPlane.position.z = 0.1
    // this.smallPlane.position.x = 0.05
    this.smallPlane.position.y = 0.05;
    this.smallPlane.rotation.x = BABYLON.Angle.FromDegrees(60).radians();

    this.smallPlane.parent = this.grip;
    this.wristGui = GUI.AdvancedDynamicTexture.CreateForMesh(
      this.smallPlane,
      256,
      256
    );
  }

  createBigPlane() {
    this.bigPlane = BABYLON.MeshBuilder.CreatePlane(
      "big_plane",
      { height: 0.5, width: 0.5 },
      this.scene
    );
    this.bigPlane.showBoundingBox = true;
    // this.bigPlane.setEnabled(false);

    this.bigPlane.position = new BABYLON.Vector3(0.3, 0.02, 0.4);
    this.bigPlane.rotation.x = BABYLON.Angle.FromDegrees(60).radians();

    //  this.bigPlane.position.z = 0.5
    //  this.bigPlane.position.y = -0.3
    //   this.bigPlane.rotation.y = BABYLON.Angle.FromDegrees(-60).radians()
    //  this.bigPlane.rotation.x = BABYLON.Angle.FromDegrees(45).radians()

    this.bigPlane.parent = this.grip;

    this.browseGui = GUI.AdvancedDynamicTexture.CreateForMesh(
      this.bigPlane,
      384,
      384
    );
  }

  prepVRScreenMenuExperience() {
    // the utilitiy layer doesn't draw the laser point on it
    // const utilLayer = BABYLON.UtilityLayerRenderer.DefaultUtilityLayer
    if (this.wristGui) {
      this.wristGui.rootContainer.dispose();
      this.browseGui.rootContainer.dispose();
      return;
    }
    this.tearDownFullScreenMenu();
    this.createSmallPlane();
    this.createBigPlane();
  }
}
