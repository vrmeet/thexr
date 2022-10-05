import * as BABYLON from "babylonjs";
import { createContext, type Context } from "./context";
import type { ComponentObj } from "./ecs/components/component-obj";
import type { ISystem } from "./ecs/builtin_systems/isystem";
import { SystemBroker } from "./ecs/builtin_systems/system-broker";
import { SystemUtilities } from "./ecs/builtin_systems/system-utilities";
import { SystemInline } from "./ecs/builtin_systems/system-inline";
import { camPosRot } from "./utils/misc";
import * as sessionPersistance from "./sessionPersistance";
import { SystemXR } from "./ecs/builtin_systems/system-xr";
import Ammo from "ammojs-typed";
import { SystemStartModal } from "./ecs/builtin_systems/system-start-modal";
import { SystemMenu } from "./ecs/builtin_systems/system-menu";
import { SystemWebRTC } from "./ecs/builtin_systems/system-webrtc";
import { SystemAttendees } from "./ecs/builtin_systems/system-attendees";
import { SystemTransform } from "./ecs/builtin_systems/system-transform";
import { SystemShape } from "./ecs/builtin_systems/system-shape";
import { SystemAvatar } from "./ecs/builtin_systems/system-avatar";
import { SystemMaterial } from "./ecs/builtin_systems/system-material";
import { SystemLighting } from "./ecs/builtin_systems/system-lighting";
/**
 * The Synergizer's job is to create the scene
 * and initialize the given systems
 */
export class Synergize {
  public context: Context;
  public scene: BABYLON.Scene;
  public freeCamera: BABYLON.FreeCamera;
  public processList: ISystem[];
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
    // create an initialize context
    this.context = createContext();
    this.context.my_member_id = my_member_id;
    this.context.my_nickname =
      sessionPersistance.getNickname()?.nickname || my_member_id;
    this.context.my_mic_muted = true;
    this.context.space_id = space_id;
    this.context.webrtc_channel_id = webrtc_channel_id;
    this.context.userToken = userToken;

    window["synergizer"] = this;
  }

  async init() {
    const scene = await this.createScene(this.engine);

    this.context.scene = scene;
    this.setupSystems();
    this.setupListeners();
  }

  setupSystems() {
    // connects to phoenix channel to send and receive events over websocket
    this.addSystem(new SystemBroker());
    // some basic animations as event rpc
    this.addSystem(new SystemUtilities());
    // maps functions to keyboard and tablet when one can't be in VR
    this.addSystem(new SystemInline());
    // setups VR
    this.addSystem(new SystemXR());
    // initial modal to get nickname, choose avatar and other options
    this.addSystem(new SystemStartModal());
    // enables a menu to mute mic, access other tools and UI
    this.addSystem(new SystemMenu());
    // enables basic voice and video communication with others over web RTC
    this.addSystem(new SystemWebRTC());
    // keeps track of who is present in the space
    this.addSystem(new SystemAttendees());
    // updates position/rotation/scale
    this.addSystem(new SystemTransform());
    // basic shapes
    this.addSystem(new SystemShape());
    // avatars
    this.addSystem(new SystemAvatar());
    this.addSystem(new SystemMaterial());
    this.addSystem(new SystemLighting());
  }

  addSystem(system: ISystem) {
    if (this.context.systems[system.name] === undefined) {
      this.context.systems[system.name] = system;
      system.init(this.context);
      this.processList = Object.values(this.context.systems)
        .filter((system) => system.registerEntity !== undefined)
        .sort((a, b) => a.order - b.order);
    }
  }

  async addRemoteSystem(systemPath: string, systemName: string = null) {
    if (!systemName) {
      const parts = systemPath.split("/");
      const lastPart = parts[parts.length - 1];
      systemName = lastPart.replace(".js", "");
    }
    await BABYLON.Tools.LoadScriptAsync(systemPath);
    const system = window[systemName];
    this.addSystem(system);
    return system;
  }

  registerEntity(entity_id: string, components: ComponentObj) {
    this.context.state[entity_id] = components;
    this.processList.forEach((system) => {
      system.registerEntity(entity_id, components);
    });
  }

  deregisterEntity(entity_id: string) {
    for (let i = this.processList.length - 1; i >= 0; i--) {
      this.processList[i].deregisterEntity(entity_id);
    }
    delete this.context.state[entity_id];
  }

  enter() {
    this.context.signalHub.outgoing.emit("entity_created", {
      id: this.context.my_member_id,
      components: {
        avatar: { head: camPosRot(this.context.scene.activeCamera) },
        nickname: this.context.my_nickname,
        mic_muted: this.context.my_mic_muted,
      },
    });
  }

  setupListeners() {
    this.context.signalHub.incoming.on("space_state").subscribe((state) => {
      // draw any previously existing entities in genserver memory
      for (const [entity_id, components] of Object.entries(state)) {
        this.context.signalHub.incoming.emit("entity_created", {
          id: entity_id,
          components: components,
        });
      }
      // send initial entity for self if not already in the state
      if (!state[this.context.my_member_id]) {
        this.enter();
      } else {
        // check if there are differences and send those
        if (
          state[this.context.my_member_id].nickname !== this.context.my_nickname
        ) {
          this.context.signalHub.outgoing.emit("components_upserted", {
            id: this.context.my_member_id,
            components: {
              nickname: this.context.my_nickname,
              mic_muted: this.context.my_mic_muted,
            },
          });
        }
      }
    });

    this.context.signalHub.incoming.on("entity_created").subscribe((evt) => {
      this.registerEntity(evt.id, evt.components);
    });

    this.context.signalHub.incoming.on("entities_deleted").subscribe((evt) => {
      evt.ids.forEach((id) => {
        this.deregisterEntity(id);
      });
    });

    this.context.signalHub.incoming
      .on("components_upserted")
      .subscribe((evt) => {
        if (this.context.state[evt.id] === undefined) {
          console.warn("cannot upsert components of undefined entity", evt);
          return;
        }
        this.processList.forEach((system) => {
          system.upsertComponents(evt.id, evt.components);
        });
        // save change into state at the end of all passes, the final result
        // would be the same if we did this before looping through each system,
        // but this way each system gets a chance to look at context.state before the
        // change, and consider components as new data
        Object.assign(this.context.state[evt.id], evt.components);
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
  async createScene(engine: BABYLON.Engine) {
    this.engine = engine;

    this.scene = new BABYLON.Scene(engine);
    this.scene.clearColor = BABYLON.Color4.FromHexString("#201111");

    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const ammo = await Ammo();

    const physicsPlugin = new BABYLON.AmmoJSPlugin(true, ammo);
    this.scene.enablePhysics(gravityVector, physicsPlugin);

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
    const prevPosition = sessionPersistance.getCameraPosRot();
    if (prevPosition) {
      this.freeCamera.position.fromArray(prevPosition.pos);
      this.freeCamera.rotationQuaternion = BABYLON.Quaternion.FromArray(
        prevPosition.rot
      );
    } else {
      this.freeCamera.position.fromArray([0, 1.5, 0]);
      this.freeCamera.rotationQuaternion = new BABYLON.Quaternion();
    }
    this.freeCamera.attachControl(this.scene.getEngine()._workingCanvas, false);
    this.freeCamera.ellipsoid = new BABYLON.Vector3(0.25, 0.1, 0.25);
    this.freeCamera.checkCollisions = true;
    this.freeCamera.onViewMatrixChangedObservable.add((cam) => {
      this.context.signalHub.movement.emit("camera_moved", camPosRot(cam));
    });
    // save position on window unload
    addEventListener(
      "beforeunload",
      () => {
        sessionPersistance.saveCameraPosRot(camPosRot(this.scene.activeCamera));
      },
      { capture: true }
    );
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

    this.context.signalHub.local.emit("system_started", true);
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
