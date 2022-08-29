import * as BABYLON from "babylonjs";
import type { ISystem } from "./ecs/systems/system";
import { context } from "./context";
/**
 * The Synergizer's job is to create the scene
 * and initialize the given systems
 */
export class Synergize {
  public scene: BABYLON.Scene;
  public freeCamera: BABYLON.FreeCamera;
  constructor(public engine: BABYLON.Engine, public systems: ISystem[]) {
    this.createScene(engine);
    this.initSystems();
    this.run();
  }
  initSystems() {
    this.systems.forEach((system) => {
      system.init();
    });
  }
  createScene(engine: BABYLON.Engine) {
    this.engine = engine;
    this.scene = new BABYLON.Scene(engine);
    context.scene = this.scene;
    this.scene.clearColor = BABYLON.Color4.FromHexString("#201111");
    this.scene.onKeyboardObservable.add((event) => {
      console.log("someting was pressed", event.event.keyCode);
    });
    BABYLON.MeshBuilder.CreateBox("", {}, this.scene);
    this.scene.collisionsEnabled = true;
    this.createDefaultCamera();
  }

  createDefaultCamera() {
    this.freeCamera = new BABYLON.FreeCamera(
      "freeCam",
      new BABYLON.Vector3(),
      this.scene
    );
    this.freeCamera.attachControl(this.scene.getEngine()._workingCanvas, false);
    this.freeCamera.rotationQuaternion = new BABYLON.Quaternion();
    this.freeCamera.ellipsoid = new BABYLON.Vector3(0.25, 0.1, 0.25);
    this.freeCamera.checkCollisions = true;
  }

  run() {
    // run the render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    // the canvas/window resize event handler
    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }

  debug() {
    this.scene.debugLayer.show({ embedMode: true });
  }

  dispose() {
    if (this.scene) {
      this.scene.dispose();
    }
  }
}
