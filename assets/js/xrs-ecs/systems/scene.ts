import type { XRS } from "../xrs";
import * as BABYLON from "babylonjs";
import Ammo from "ammojs-typed";
import * as sessionPersistance from "../../sessionPersistance";
import type { Context } from "../context";
import { camPosRot } from "../../utils/misc";
import { BaseSystem } from "../base-system";

export class SystemScene extends BaseSystem {
  public xrs: XRS;
  public name: "scene";
  public order = 0;
  public context: Context;

  init(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
    this.createScene();
    this.createDefaultCamera();
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
}
