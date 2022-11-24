import type { XRS } from "../xrs";
import * as BABYLON from "babylonjs";
import Ammo from "ammojs-typed";
import * as sessionPersistance from "../../sessionPersistance";
import type { Context } from "../context";
import { camPosRot } from "../../utils/misc";
import type { ISystem } from "../system";
import type { ComponentObj } from "../../ecs/components/component-obj";

export class SystemScene implements ISystem {
  public xrs: XRS;
  public name = "scene";
  public context: Context;

  setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
    this.createEngine();
    this.createScene();
    this.createDefaultCamera();
  }

  setupListeners() {
    this.xrs.context.scene.onPointerObservable.add((pointerInfo) => {
      this.context.signalHub.local.emit("pointer_info", pointerInfo);
      if (
        pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK &&
        pointerInfo.pickInfo.hit &&
        pointerInfo.pickInfo.pickedMesh
      ) {
        // generic message some mesh picked
        this.context.signalHub.local.emit(
          "mesh_picked",
          pointerInfo.pickInfo.pickedMesh
        );
      }
    });
  }
  createEngine() {
    if (!this.context.engine) {
      const canvas = document.getElementById(
        this.context.space.id
      ) as HTMLCanvasElement;
      this.context.engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
    }
  }

  start() {
    // run the render loop
    this.context.engine.runRenderLoop(() => {
      this.context.scene.render();
    });
    // the canvas/window resize event handler
    window.addEventListener("resize", () => {
      this.context.engine.resize();
    });
  }

  async createScene() {
    this.context.scene = new BABYLON.Scene(this.context.engine);

    this.context.scene.clearColor = BABYLON.Color4.FromHexString("#201111");

    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const ammo = await Ammo();

    const physicsPlugin = new BABYLON.AmmoJSPlugin(true, ammo);
    this.context.scene.enablePhysics(gravityVector, physicsPlugin);
  }

  createDefaultCamera() {
    const freeCamera = new BABYLON.FreeCamera(
      "freeCam",
      new BABYLON.Vector3(),
      this.context.scene
    );
    const prevPosition = sessionPersistance.getCameraPosRot(
      this.context.space.id
    );
    if (prevPosition) {
      freeCamera.position.fromArray(prevPosition.pos);
      freeCamera.rotationQuaternion = BABYLON.Quaternion.FromArray(
        prevPosition.rot
      );
    } else {
      freeCamera.position.fromArray([0, 1.5, 0]);
      freeCamera.rotationQuaternion = new BABYLON.Quaternion();
    }
    freeCamera.attachControl(
      this.context.scene.getEngine()._workingCanvas,
      false
    );
    freeCamera.ellipsoid = new BABYLON.Vector3(0.25, 0.1, 0.25);
    freeCamera.checkCollisions = true;
    freeCamera.onViewMatrixChangedObservable.add((cam) => {
      this.context.signalHub.movement.emit("camera_moved", camPosRot(cam));
    });
    // save position on window unload
    addEventListener(
      "beforeunload",
      () => {
        sessionPersistance.saveCameraPosRot(
          this.context.space.id,
          camPosRot(this.context.scene.activeCamera)
        );
      },
      { capture: true }
    );
  }

  // this is called before the user enters the space, so they can see some of it
  parseState(state: { [entityName: string]: ComponentObj }) {
    Object.entries(state).forEach(([entityName, components]) => {
      if (components && components.avatar === undefined) {
        this.xrs.createEntity(entityName, components);
      }
    });
  }
}
