/// <reference types="svelte" />
import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { filter } from "rxjs";
import type { SignalHub } from "../../signalHub";
import { cameraFrontPosition } from "../../utils/misc";
import type { Context } from "../context";
import type { ISystem } from "../system";
import type { XRS } from "../xrs";
import MenuBar from "../../svelte/MenuBar.svelte";

export const BAR_WIDTH = 256;
export const BAR_HEIGHT = 256;
export const HOME_WIDTH = 640;
export const HOME_HEIGHT = 384;
export const BAR_SCALING = 0.1 / 256;
export const HOME_SCALING = 1.0 / 384;

export class SystemMenu implements ISystem {
  public name = "menu";
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
  // used to determine when to attach keyboard
  public inputs: Record<string, GUI.InputText> = {};
  public guiControls: Record<string, GUI.Control> = {};
  public xrs: XRS;
  setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
    this.scene = xrs.context.scene;
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

    this.signalHub = xrs.context.signalHub;

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

    // make sure there is something to bind menu to
    this.signalHub.local
      .on("controller_ready")
      .pipe(filter((payload) => payload.hand === "left"))
      .subscribe((payload) => {
        this.mode = "vr";
        this.grip = payload.grip;
        this.prepVRScreenMenuExperience();
        this.renderMenuToTexture();
      });

    // if controller is removed for a moment, the menu doesn't have a grip to be parented to
    this.signalHub.local
      .on("controller_removed")
      .pipe(filter((payload) => payload.hand === "left"))
      .subscribe(() => {
        if (this.smallPlane) {
          this.smallPlane.setEnabled(false);
          this.bigPlane.setEnabled(false);
        }
      });
  }

  buttonFromEl(el: HTMLButtonElement, style: CSSStyleDeclaration) {
    const gui = new GUI.Button(el.id);
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

    if (el.disabled) {
      gui.isEnabled = false;
      rect.background = "#888888";
    }
    // setInterval(() => {
    //
    //   document.getElementById(el.id);
    //   if (el.disabled) {
    //     gui.isEnabled = false;
    //     rect.background = "#888888";
    //   } else {
    //     gui.isEnabled = true;
    //     rect.background = "#FF00FF";
    //   }
    // }, 1000);

    rect.addControl(label);
    gui.addControl(rect);
    return gui;
  }

  rectFromEl(el: HTMLDivElement, style: CSSStyleDeclaration) {
    let gui;
    if (el.id === "colorpicker") {
      gui = new GUI.ColorPicker();
      gui.value = BABYLON.Color3.FromHexString(el.dataset.meshcolor);

      // gui.height = "150px";
      // gui.width = "150px";
      // picker.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

      gui.onValueChangedObservable.add((value) => {
        this.context.signalHub.local.emit("color_picked", value);
      });
      return gui;
    }
    if (style.overflow === "scroll") {
      gui = new GUI.ScrollViewer(el.id);
    } else {
      gui = new GUI.Rectangle(el.id);
    }
    gui.thickness = Number(style.borderWidth.replace("px", ""));

    gui.color = style.borderColor;
    gui.background = style.backgroundColor;
    if (el.children.length === 0 && el.innerText.length > 0) {
      const label = new GUI.TextBlock(`${el.id}_inner_txt`);
      label.text = el.innerText;
      label.fontSize = 14;
      label.color = style.color;
      label.paddingLeft = style.paddingLeft;
      label.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      gui.addControl(label);
    }
    return gui;
  }

  inputFromEl(el: HTMLInputElement, style: CSSStyleDeclaration) {
    const input = new GUI.InputText(el.id);
    // input.width = 0.2;
    // input.maxWidth = 0.2;
    // input.height = "40px";
    input.text = el.value;
    input.color = "white";
    input.onTextChangedObservable.add((data, state) => {
      el.value = data.text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

    this.inputs[el.id] = input;
    // input.background = "green";
    return input;
  }

  htmlToGui(el: HTMLElement) {
    let gui: GUI.Container;
    const style = getComputedStyle(el);
    switch (el.nodeName) {
      case "DIV":
        gui = this.rectFromEl(el as HTMLDivElement, style) as GUI.Container;
        // gui.color = "#ff0000";
        // gui.background = "#aa00ee";
        break;
      case "BUTTON":
        gui = this.buttonFromEl(el as HTMLButtonElement, style);
        break;
      case "INPUT":
        gui = this.inputFromEl(
          el as HTMLInputElement,
          style
        ) as unknown as GUI.Container;
        break;
      default:
        gui = new GUI.Container(el.id);
    }
    if (el.id) {
      this.guiControls[el.id] = gui;
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
      },
    });
  }

  renderMenuToFullScreen() {
    this.prepFullScreenMenuExperience();
    const menuBarCtrl = this.htmlToGui(document.getElementById("menu_bar"));

    menuBarCtrl.scaleX = 0.5;
    menuBarCtrl.scaleY = 0.5;
    menuBarCtrl.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    menuBarCtrl.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    menuBarCtrl.topInPixels = 0;
    menuBarCtrl.leftInPixels = 0;
    menuBarCtrl.transformCenterX = 0;
    menuBarCtrl.transformCenterY = 0;

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
      menuHome.topInPixels = Math.ceil(BAR_HEIGHT / 2);
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
      if (!this.bigPlane) {
        this.createBigPlane();
      } else {
        this.bigPlane.setEnabled(true);
      }
      const menuHome = this.htmlToGui(document.getElementById("menu_home"));
      menuHome.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      menuHome.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      menuHome.topInPixels = 0;
      menuHome.leftInPixels = 0;
      this.browseGui.addControl(menuHome);
      // add a keyboard if there are any inputs
      if (Object.keys(this.inputs).length > 0) {
        const keyboard = GUI.VirtualKeyboard.CreateDefaultLayout("keyboard");
        keyboard.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        keyboard.zIndex = 100;
        Object.values(this.inputs).forEach((i) => {
          keyboard.connect(i);
        });
        this.browseGui.addControl(keyboard);
      }

      // this.bigPlane.setEnabled(true);
    } else {
      this.bigPlane?.setEnabled(false);
    }
  }

  refresh(el: HTMLElement) {
    if (el && this.guiControls[el.id]) {
      const ctrl = this.guiControls[el.id];

      const parent = ctrl.parent;
      parent.removeControl(ctrl);
      const refreshedGui = this.htmlToGui(el);
      this.guiControls[el.id] = refreshedGui;
      parent.addControl(refreshedGui);
    }
  }

  renderMenuToTexture() {
    this.guiControls = {};
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
      { height: BAR_HEIGHT * BAR_SCALING, width: BAR_WIDTH * BAR_SCALING },
      this.scene
    );
    this.smallPlane.metadata = { menu: true };
    this.smallPlane.showBoundingBox = true;
    // this.smallPlane.position.z = 0.1
    // this.smallPlane.position.x = 0.05
    this.smallPlane.position.y = 0.05;
    this.smallPlane.rotation.x = BABYLON.Angle.FromDegrees(60).radians();

    this.smallPlane.parent = this.grip;
    this.wristGui = GUI.AdvancedDynamicTexture.CreateForMesh(
      this.smallPlane,
      BAR_WIDTH,
      BAR_HEIGHT
    );
  }

  createBigPlane() {
    this.bigPlane = BABYLON.MeshBuilder.CreatePlane(
      "big_plane",
      { height: HOME_HEIGHT * HOME_SCALING, width: HOME_WIDTH * HOME_SCALING },
      this.scene
    );

    // this.bigPlane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
    this.bigPlane.showBoundingBox = true;
    this.bigPlane.metadata = { menu: true };
    // this.bigPlane.setEnabled(false);
    // this.bigPlane.position = new BABYLON.Vector3(0.3, 0.02, 0.4);
    // this.bigPlane.rotation.x = BABYLON.Angle.FromDegrees(60).radians();

    //  this.bigPlane.position.z = 0.5
    //  this.bigPlane.position.y = -0.3
    //   this.bigPlane.rotation.y = BABYLON.Angle.FromDegrees(-60).radians()
    //  this.bigPlane.rotation.x = BABYLON.Angle.FromDegrees(45).radians()

    // this.bigPlane.parent = this.grip;
    this.bigPlane.position.fromArray(cameraFrontPosition(this.scene, 1));
    this.bigPlane.lookAt(
      BABYLON.Vector3.FromArray(cameraFrontPosition(this.scene, 3))
    );
    this.browseGui = GUI.AdvancedDynamicTexture.CreateForMesh(
      this.bigPlane,
      HOME_WIDTH,
      HOME_HEIGHT
    );
    this.inputs = {};
  }

  prepVRScreenMenuExperience() {
    // the utilitiy layer doesn't draw the laser point on it
    // const utilLayer = BABYLON.UtilityLayerRenderer.DefaultUtilityLayer
    if (this.wristGui) {
      // this.wristGui.rootContainer.dispose();
      // this.browseGui?.rootContainer?.dispose();
      // if (this.keyboard && this.browseGui) {
      //   this.browseGui?.addControl(this.keyboard);
      // } else {
      //   console.log("no keyboard and no brow to attac")
      // }
      // also try reparenting if controller had blipped away for a moment
      this.smallPlane.setEnabled(true);
      this.smallPlane.parent = this.grip;
      // this.bigPlane.position.fromArray(cameraFrontPosition(this.scene, 1));
      // this.bigPlane.parent = this.grip;
      return;
    }
    this.tearDownFullScreenMenu();
    this.createSmallPlane();
    // this.createBigPlane();
  }
}
