import type { ComponentObj } from "../ecs/components/component-obj";
import { defaultContext, type Context, type OPTS } from "./context";
import { Entity } from "./entity";
import type { ISystem } from "./system";
import { SystemAttendance } from "./systems/attendance";
import { SystemAvatar } from "./systems/avatar";
import { SystemBroker } from "./systems/broker";
import { SystemCollectable } from "./systems/collectable";
import { SystemFloor } from "./systems/floor";
import { SystemGun } from "./systems/gun";
import { SystemHoldable } from "./systems/holdable";
import { SystemHUD } from "./systems/hud";
import { SystemInline } from "./systems/inline";
import { SystemLighting } from "./systems/lighting";
import { SystemLogger } from "./systems/logger";
import { SystemMaterial } from "./systems/material";
import { SystemMenu } from "./systems/menu";
import { SystemScene } from "./systems/scene";
import { SystemShape } from "./systems/shape";
import { SystemSpin } from "./systems/spin";
import { SystemStartModal } from "./systems/start-modal";
import { SystemText3D } from "./systems/text3d";
import { SystemThrowable } from "./systems/throwable";
import { SystemTintOverlay } from "./systems/tint-overlay";
import { SystemTransform } from "./systems/transform";
import { SystemTriggerable } from "./systems/triggerable";
import { SystemUtilities } from "./systems/utilities";
import { SystemVisiblity } from "./systems/visibility";
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

    this.context.systems[sys.name] = sys;
  }
  deregisterSystem(name: string) {
    const system = this.getSystem(name);
    if (system) {
      if (system.tearDown) {
        system.tearDown();
      }
    }
  }

  getSystem(name: string) {
    const system = this.context.systems[name] || null;
    if (!system) {
      console.warn("No system", name);
    }
    return system;
  }

  // convenince function for sorting an object representing components into a
  // sorted array of component name and values
  sortComponentsBySystemOrder(
    components: ComponentObj
  ): { componentName: string; componentValue: any }[] {
    return Object.keys(components)
      .map((componentName) => this.getSystem(componentName))
      .filter((sys) => sys !== null)
      .sort((a, b) => a.order - b.order)
      .reduce((acc, sys) => {
        acc.push({
          componentName: sys.name,
          componentValue: components[sys.name],
        });
        return acc;
      }, []);
  }

  // has protection for not doubling entity if already exists
  createEntity(name: string, components: ComponentObj = {}) {
    const entity = this.getEntity(name) || new Entity(name, this);
    this.context.entities[name] = entity;
    entity.upsertComponents(components);
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

  printState() {
    return Object.values(this.context.entities).reduce((acc, entity) => {
      acc[entity.name] = entity.componentData();
      return acc;
    }, {});
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
    this.registerSystem(new SystemHoldable());
    this.registerSystem(new SystemThrowable());
    this.registerSystem(new SystemTriggerable());
    this.registerSystem(new SystemGun());
    this.registerSystem(new SystemSpin());
    this.registerSystem(new SystemVisiblity());
    this.registerSystem(new SystemText3D());
  }
}
