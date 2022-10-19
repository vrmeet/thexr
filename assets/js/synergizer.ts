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
import { SystemAttendance } from "./ecs/builtin_systems/system-attendance";
import { SystemTransform } from "./ecs/builtin_systems/system-transform";
import { SystemShape } from "./ecs/builtin_systems/system-shape";
import { SystemAvatar } from "./ecs/builtin_systems/system-avatar";
import { SystemMaterial } from "./ecs/builtin_systems/system-material";
import { SystemLighting } from "./ecs/builtin_systems/system-lighting";
import { SystemGrabbable } from "./ecs/builtin_systems/system-grabbable";
import { SystemFloor } from "./ecs/builtin_systems/system-floor";
import { SystemLogger } from "./ecs/builtin_systems/system-logger";
import { SystemXRFlight } from "./ecs/builtin_systems/system-xr-flight";
import { SystemShootable } from "./ecs/builtin_systems/system-shootable";
import { SystemSerializedMesh } from "./ecs/builtin_systems/system-serialized-mesh";
/**
 * The Synergizer's job is to create the scene
 * and initialize the given systems
 */
export class Synergize {
  public context: Context;
  public scene: BABYLON.Scene;
  public freeCamera: BABYLON.FreeCamera;
  // order matters when creating an entity
  public processList: ISystem[];
  /**
   *
   * @param my_member_id
   * @param engine with a canvas
   */
  constructor(
    my_member_id: string,
    space: { id: string; name: string; state_id: string },
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
    this.context.space = space;
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
    // setup VR capability and broadcasts buttons and motion
    this.addSystem(new SystemXR());
    // initial modal to get nickname, choose avatar and other options
    this.addSystem(new SystemStartModal());
    // enables a menu to mute mic, access other tools and UI
    this.addSystem(new SystemMenu());
    // enables basic voice and video communication with others over web RTC
    this.addSystem(new SystemWebRTC());
    // keeps track of who is present in the space
    this.addSystem(new SystemAttendance());
    // updates position/rotation/scale as well as parenting
    this.addSystem(new SystemTransform());
    // create basic primitive shapes
    this.addSystem(new SystemShape());
    // avatars for people in the space
    this.addSystem(new SystemAvatar());
    // assign color and grid to basic shapes
    this.addSystem(new SystemMaterial());
    // makes a basic light in the scene
    this.addSystem(new SystemLighting());
    // detects mesh under the palm and adds/removes parenting component
    this.addSystem(new SystemGrabbable());
    // floor component makes a mesh a teleportable destination
    this.addSystem(new SystemFloor());
    // brings console logs into VR for easier debugging
    this.addSystem(new SystemLogger());
    // brings joystick flight to VR
    this.addSystem(new SystemXRFlight());
    // loading models from serialized geometry
    this.addSystem(new SystemSerializedMesh());
    // shootable
    this.addSystem(new SystemShootable());
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

  async registerEntity(entity_id: string, components: ComponentObj) {
    this.context.state[entity_id] = components;
    for (let i = 0; i < this.processList.length; i++) {
      await this.processList[i].registerEntity(entity_id, components);
    }
  }

  deregisterEntity(entity_id: string) {
    for (let i = this.processList.length - 1; i >= 0; i--) {
      if (this.processList[i].deregisterEntity !== undefined) {
        this.processList[i].deregisterEntity(entity_id);
      }
    }
    delete this.context.state[entity_id];
  }

  enter() {
    this.context.signalHub.outgoing.emit("entity_created", {
      id: this.context.my_member_id,
      components: {
        avatar: { head: camPosRot(this.context.scene.activeCamera) },
        attendance: {
          nickname: this.context.my_nickname,
          mic_muted: this.context.my_mic_muted,
        },
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
              attendance: {
                nickname: this.context.my_nickname,
                mic_muted: this.context.my_mic_muted,
              },
            },
          });
        }
      }
    });

    this.context.signalHub.incoming.on("entity_created").subscribe((evt) => {
      // components can be nil if just deleted and just loaded state from a genserver
      if (evt.components !== null) {
        this.registerEntity(evt.id, evt.components);
      }
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
        Object.keys(evt.components).forEach((compName) => {
          // call systems upsertComponents func if it is defined
          if (
            this.context.systems[compName] !== undefined &&
            this.context.systems[compName].upsertComponents !== undefined
          ) {
            this.context.systems[compName].upsertComponents(
              evt.id,
              evt.components
            );
          }
          // patch new values into the state
          if (
            this.context.state[evt.id][compName] !== undefined &&
            typeof this.context.state[evt.id][compName] === "object"
          ) {
            Object.assign(
              this.context.state[evt.id][compName],
              evt.components[compName]
            );
          } else {
            this.context.state[evt.id][compName] = evt.components[compName];
          }
        });
      });

    this.context.signalHub.incoming.on("msg").subscribe((data) => {
      const system = this.context.systems[data.system];
      if (system && system.process_msg !== undefined) {
        system.process_msg(data.data);
      }
    });

    // this.context.signalHub.incoming
    //   .on("components_removed")
    //   .subscribe((evt) => {
    //     if (this.context.state[evt.id] === undefined) {
    //       console.warn("cannot delete components of undefined entity", evt);
    //       return;
    //     }
    //     // TODO
    //   });

    // route clicks to mesh picked event
    this.scene.onPointerObservable.add((pointerInfo) => {
      this.context.signalHub.local.emit("pointer_info", pointerInfo);
      if (
        pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK &&
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

    this.createDefaultCamera();
    return this.scene;
  }

  createDefaultCamera() {
    this.freeCamera = new BABYLON.FreeCamera(
      "freeCam",
      new BABYLON.Vector3(),
      this.scene
    );
    const prevPosition = sessionPersistance.getCameraPosRot(
      this.context.space.id
    );
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
        sessionPersistance.saveCameraPosRot(
          this.context.space.id,
          camPosRot(this.scene.activeCamera)
        );
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
