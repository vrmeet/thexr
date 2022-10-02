/// <reference types="svelte" />
import type { Context } from "../context";
import type { IService } from "./service";
import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import type { SignalHub } from "../signalHub";
import { filter, take } from "rxjs";
import { isMobileVR } from "../utils/utils-browser";

import MenuBar from "../svelte/MenuBar.svelte";

export class ServiceMenu implements IService {
  name: "service-menu";
  public fsGui: GUI.AdvancedDynamicTexture;
  public smallPlane: BABYLON.AbstractMesh;
  public bigPlane: BABYLON.AbstractMesh;
  public wristGui: GUI.AdvancedDynamicTexture;
  public browseGui: GUI.AdvancedDynamicTexture;

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

    this.signalHub = context.signalHub;

    this.signalHub.local
      .on("client_ready")
      .pipe(filter((choice) => choice === "enter"))
      .subscribe(() => {
        // check if mobile
        if (isMobileVR()) {
          this.mode = "vr";
        } else {
          this.mode = "fs";
        }
        this.initializeMenu();
      });

    this.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR))
      .subscribe(() => {
        this.mode = "fs";
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
            this.createVRMenuOverlay(payload.grip);
            this.renderMenuToTexture();
          });
      });

    /*
   
*/
  }

  buttonFromEl(el: HTMLButtonElement) {
    const gui = new GUI.Button(el.id);
    const style = getComputedStyle(el);

    gui.hoverCursor = "pointer";
    gui.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    gui.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

    gui.isPointerBlocker = true;
    gui.leftInPixels = el.offsetLeft;
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
    label.fontSize = 12;
    label.fontWeight = "bold";
    label.color = style.color;
    label.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

    rect.addControl(label);
    gui.addControl(rect);
    return gui;
  }

  rectFromEl(el: HTMLDivElement) {
    const gui = new GUI.Rectangle(el.id);
    const style = getComputedStyle(el);
    console.log("border width", style.borderWidth);
    gui.thickness = Number(style.borderWidth.replace("px", ""));

    gui.color = style.borderColor;

    // gui.background = style["background-color"];
    return gui;
  }

  htmlToGui(el: HTMLElement) {
    let gui: GUI.Container;
    console.log("at node", el.innerText);
    switch (el.nodeName) {
      case "DIV":
        gui = this.rectFromEl(el as HTMLDivElement);
        // gui.color = "#ff0000";
        // gui.background = "#aa00ee";
        break;
      case "BUTTON":
        gui = this.buttonFromEl(el as HTMLButtonElement);
        break;
      default:
        gui = new GUI.Container(el.id);
    }

    Object.keys(el.dataset).forEach((key) => {
      gui[key] = el.dataset[key];
    });

    // visit each child
    for (let i = 0; i < el.children.length; i++) {
      const childControl = this.htmlToGui(el.children.item(i) as HTMLElement);
      gui.addControl(childControl);
    }
    // set height and width at the end as the last thing you do
    //because adding children into a container seems to
    // set them to % instead of px dimensions
    gui.height = `${el.clientHeight}px`;
    gui.width = `${el.clientWidth}px`;

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

  renderMenuToTexture() {
    if (this.mode === "fs") {
      if (this.fsGui) {
        this.fsGui.rootContainer.dispose();
      } else {
        this.createFullScreenMenuOverlay();
      }
      const menuBarCtrl = this.htmlToGui(document.getElementById("menu_bar"));
      menuBarCtrl.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      menuBarCtrl.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
      // this.fsGui.rootContainer.scaleX = window.devicePixelRatio;
      // this.fsGui.rootContainer.scaleY = window.devicePixelRatio;
      this.fsGui.addControl(menuBarCtrl);
      const elementMenuHome = document.getElementById("menu_home");
      if (elementMenuHome) {
        const menuHome = this.htmlToGui(document.getElementById("menu_home"));
        menuHome.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        menuHome.leftInPixels = 100;

        this.fsGui.addControl(menuHome);
      }
      // console.log("call", value);
    } else {
      // if vr
      if (this.wristGui) {
        this.wristGui.rootContainer.dispose();
        this.browseGui.rootContainer.dispose();
        const menuBarCtrl = this.htmlToGui(document.getElementById("menu_bar"));
        this.wristGui.addControl(menuBarCtrl);
        const elementMenuHome = document.getElementById("menu_home");
        if (elementMenuHome) {
          const menuHome = this.htmlToGui(document.getElementById("menu_home"));

          this.browseGui.addControl(menuHome);
          this.bigPlane.setEnabled(true);
        } else {
          this.bigPlane.setEnabled(false);
        }
      }
    }
  }

  createFullScreenMenuOverlay() {
    this.wristGui?.dispose();
    this.browseGui?.dispose();
    this.smallPlane?.dispose();
    this.bigPlane?.dispose();
    this.wristGui = null;
    this.browseGui = null;
    this.smallPlane = null;
    this.bigPlane = null;

    this.fsGui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("fsGui");
  }

  createVRMenuOverlay(grip: BABYLON.AbstractMesh) {
    // the utilitiy layer doesn't draw the laser point on it
    // const utilLayer = BABYLON.UtilityLayerRenderer.DefaultUtilityLayer
    this.fsGui?.dispose();
    this.fsGui = null;
    this.smallPlane = BABYLON.MeshBuilder.CreatePlane(
      "wrist_plane",
      { height: 0.1, width: 0.1 },
      this.scene
    );
    this.smallPlane.showBoundingBox = true;
    // this.smallPlane.position.z = 0.1
    // this.smallPlane.position.x = 0.05
    this.smallPlane.position.y = 0.05;
    this.smallPlane.rotation.x = BABYLON.Angle.FromDegrees(60).radians();

    this.smallPlane.parent = grip;
    this.wristGui = GUI.AdvancedDynamicTexture.CreateForMesh(
      this.smallPlane,
      256,
      256
    );

    this.bigPlane = BABYLON.MeshBuilder.CreatePlane(
      "browse_plane",
      { height: 0.5, width: 0.5 },
      this.scene
    );
    this.bigPlane.showBoundingBox = true;
    this.bigPlane.setEnabled(false);

    this.bigPlane.position = new BABYLON.Vector3(0.3, 0.02, 0.4);
    this.bigPlane.rotation.x = BABYLON.Angle.FromDegrees(60).radians();

    //  this.bigPlane.position.z = 0.5
    //  this.bigPlane.position.y = -0.3
    //   this.bigPlane.rotation.y = BABYLON.Angle.FromDegrees(-60).radians()
    //  this.bigPlane.rotation.x = BABYLON.Angle.FromDegrees(45).radians()

    this.bigPlane.parent = grip;

    this.browseGui = GUI.AdvancedDynamicTexture.CreateForMesh(
      this.bigPlane,
      640,
      640
    );
  }
}
