import type { ComponentObj } from "../ecs/components/component-obj";
import { Avatar } from "../scene/avatar";
import { defaultContext, type Context, type OPTS } from "./context";
import { Entity } from "./entity";
import type { ISystem } from "./system";
import { SystemAttendance } from "./systems/attendance";
import { SystemAvatar } from "./systems/avatar";
import { SystemBroker } from "./systems/broker";
import { SystemCollectable } from "./systems/collectable";
import { SystemFloor } from "./systems/floor";
import { SystemHUD } from "./systems/hud";
import { SystemInline } from "./systems/inline";
import { SystemLighting } from "./systems/lighting";
import { SystemLogger } from "./systems/logger";
import { SystemMaterial } from "./systems/material";
import { SystemMenu } from "./systems/menu";
import { SystemScene } from "./systems/scene";
import { SystemShape } from "./systems/shape";
import { SystemStartModal } from "./systems/start-modal";
import { SystemTintOverlay } from "./systems/tint-overlay";
import { SystemTransform } from "./systems/transform";
import { SystemUtilities } from "./systems/utilities";
import { SystemWebRTC } from "./systems/webrtc";
import { SystemXR } from "./systems/xr";
import { SystemXRFlight } from "./systems/xr-flight";

export class XRS {
  public context: Context;

  constructor() {
    this.context = defaultContext();
  }

  registerSystem(sys: ISystem) {
    if (!sys.name) {
      throw new Error("Invalid System Name");
    }
    sys.setup(this);
    console.log("initialized", sys.name);
    this.context.systems[sys.name] = sys;
  }
  deregisterSystem(name: string) {
    const system = this.getSystem(name);
    if (system) {
      system.tearDown();
    }
  }

  getSystem(name: string) {
    const system = this.context.systems[name] || null;
    if (!system) {
      console.warn("No system", name);
    }
    return system;
  }

  // has protection for not doubling entity if already exists
  createEntity(name: string, components: ComponentObj = {}) {
    const entity = this.getEntity(name) || new Entity(name, this);
    this.context.entities[name] = entity;
    // sort components by system order
    Object.keys(components)
      .map((componentName) => this.getSystem(componentName))
      .filter((system) => system !== null)
      .sort((a, b) => a.order - b.order)
      .forEach((system) => {
        if (entity.hasComponent(system.name)) {
          entity.updateComponent(system.name, components[system.name]);
        } else {
          entity.addComponent(system.name, components[system.name]);
        }
      });

    return entity;
  }

  getEntity(name: string) {
    return this.context.entities[name] || null;
  }

  deleteEntity(name: string) {
    const entity = this.getEntity(name);
    if (entity) {
      entity.dispose();
      delete this.context.entities[name];
    }
  }

  clearAllEntities() {
    Object.keys(this.context.entities).forEach((entityName) => {
      this.deleteEntity(entityName);
    });
  }

  init(
    opts: Partial<OPTS>,
    beginningState: { [entityName: string]: ComponentObj }
  ) {
    this.context = Object.assign(this.context, opts);

    this.initDefaultSystems();
    const systemScene = this.getSystem("scene") as SystemScene;
    systemScene.start();
    systemScene.parseState(beginningState);

    this.context.signalHub.local.emit("system_started", true);
  }

  debug() {
    this.context.scene.debugLayer.show({ embedMode: true });
  }

  initDefaultSystems() {
    // order matters here since context is updated between systems
    // for example shape depends on context.scene
    this.registerSystem(new SystemScene());
    this.registerSystem(new SystemShape());
    this.registerSystem(new SystemMaterial());
    this.registerSystem(new SystemXR());
    this.registerSystem(new SystemFloor());
    this.registerSystem(new SystemInline());
    this.registerSystem(new SystemLighting());
    this.registerSystem(new SystemBroker());
    this.registerSystem(new SystemAttendance());
    this.registerSystem(new SystemStartModal());
    this.registerSystem(new SystemTransform());
    this.registerSystem(new SystemUtilities());
    this.registerSystem(new SystemHUD());
    this.registerSystem(new SystemLogger());
    this.registerSystem(new SystemMenu());
    this.registerSystem(new SystemWebRTC());
    this.registerSystem(new SystemXRFlight());
    this.registerSystem(new SystemAvatar());
    this.registerSystem(new SystemTintOverlay());
    this.registerSystem(new SystemCollectable());
  }
}
