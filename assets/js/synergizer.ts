import * as BABYLON from "babylonjs";
import type { ISystem } from "./ecs/system";
import { createContext, type Context } from "./context";
import type { ComponentObj } from "./ecs/components/component-obj";
import type { IService } from "./services/service";
import { ServiceBroker } from "./services/services-broker";
/**
 * The Synergizer's job is to create the scene
 * and initialize the given systems
 */
export class Synergize {
  public context: Context;
  public scene: BABYLON.Scene;
  public freeCamera: BABYLON.FreeCamera;
  public systemsForEntities: ISystem[] = [];
  public systems: Record<string, ISystem> = {};
  public services: Record<string, IService> = {};
  /**
   *
   * @param my_member_id
   * @param engine with a canvas
   */
  constructor(
    my_member_id: string,
    space_id: string,
    webrtc_channel_id: string,
    userToken: string,
    public engine: BABYLON.Engine
  ) {
    this.context = createContext();
    this.context.synergizer = this;
    this.context.my_member_id = my_member_id;
    this.context.space_id = space_id;
    this.context.webrtc_channel_id = webrtc_channel_id;
    this.context.userToken = userToken;
    this.context.scene = this.createScene(engine);
    this.setupServices();
    this.setupListeners();
    this.run();
    window["synergizer"] = this;
  }

  setupServices() {
    this.addService(new ServiceBroker());
  }

  addService(service: IService) {
    this.services[service.name] = service;
    service.init(this.context);
  }

  getSystemByName(name: string) {
    return this.systems[name];
  }
  async addSystem(systemPath: string, systemName: string) {
    await BABYLON.Tools.LoadScriptAsync(systemPath);
    console.log("adding system", systemPath);
    const system = window[systemName];
    if (!this.systems[system.name]) {
      system.init(this.context);
      if (system.initEntity) {
        this.systemsForEntities.push(system);
      }
      this.systems[system.name] = system;
    }
  }

  initEntity(entity_id: string, components: ComponentObj) {
    this.systemsForEntities.forEach((system) => {
      system.initEntity(entity_id, components);
    });
  }

  setupListeners() {
    this.context.signalHub.incoming.on("entity_created").subscribe((evt) => {
      this.context.state[evt.id] = evt.components;
      this.initEntity(evt.id, evt.components);
    });
    // route clicks to mesh picked event
    this.scene.onPointerObservable.add((pointerInfo) => {
      this.context.signalHub.local.emit("pointer_info", pointerInfo);
      if (
        pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN &&
        pointerInfo.pickInfo.hit &&
        pointerInfo.pickInfo.pickedMesh
      ) {
        this.context.signalHub.local.emit(
          "mesh_picked",
          pointerInfo.pickInfo.pickedMesh
        );
      }
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
    this.freeCamera.onViewMatrixChangedObservable.add((cam) => {
      this.context.signalHub.movement.emit("camera_moved", {
        pos: cam.position.asArray(),
        rot: cam.absoluteRotation.asArray(),
      });
    });
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
