import * as BABYLON from "babylonjs";
import type { ISystem } from "./ecs/systems/system";
import { createContext, type Context } from "./context";
import { EventName } from "./event-names";
import { filter } from "rxjs/operators";
import { Entity } from "./ecs/entities/entity";
/**
 * The Synergizer's job is to create the scene
 * and initialize the given systems
 */
export class Synergize {
  public context: Context;
  public scene: BABYLON.Scene;
  public freeCamera: BABYLON.FreeCamera;
  public systemsForEntities: ISystem[] = [];
  constructor(
    my_member_id: string,
    public engine: BABYLON.Engine,
    public systems: ISystem[]
  ) {
    this.context = createContext();
    window["context"] = this.context;
    this.context.my_member_id = my_member_id;
    this.context.scene = this.createScene(engine);
    this.initSystems();
    this.setupListeners();
    this.run();
    window["synergizer"] = this;
  }
  addSystem(system: ISystem) {
    system.init(this.context);
    if (system.initEntity) {
      this.systemsForEntities.push(system);
    }
  }
  initSystems() {
    this.systems.forEach((system) => {
      this.addSystem(system);
    });
  }
  setupListeners() {
    this.context.signalHub.incoming
      .on("event")
      .pipe(filter((evt) => evt.m === EventName.entity_created2))
      .subscribe((evt) => {
        console.log("we got an event");
        this.systemsForEntities.forEach((system) => {
          const entity = new Entity(
            evt.p["entity_id"],
            evt.p["components"],
            this.scene
          );
          system.initEntity(entity);
        });
      });
  }
  createScene(engine: BABYLON.Engine) {
    this.engine = engine;
    this.scene = new BABYLON.Scene(engine);
    this.scene.clearColor = BABYLON.Color4.FromHexString("#201111");
    // this.scene.onKeyboardObservable.add((event) => {
    //   console.log("someting was pressed", event.event.keyCode);
    // });
    this.createDefaultCamera();
    return this.scene;
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
