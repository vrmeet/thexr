import { defaultContext, type Context, type OPTS } from "./context";
import { Entity } from "./entity";
import type { ISystem } from "./system";
import { SystemAttendance } from "./systems/attendance";
import { SystemBroker } from "./systems/broker";
import { SystemScene } from "./systems/scene";
import { SystemShape } from "./systems/shape";

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
      system.tearDown();
    }
  }

  getSystem(name: string) {
    return this.context.systems[name];
  }

  createEntity(name: string) {
    const entity = new Entity(name, this);
    this.context.entities[name] = entity;
    return entity;
  }

  getEntity(name: string) {
    return this.context.entities[name];
  }

  deleteEntity(name: string) {
    const entity = this.getEntity(name);
    if (entity) {
      entity.dispose();
      delete this.context.entities[name];
    }
  }

  init(opts: Partial<OPTS>) {
    this.context = Object.assign(this.context, opts);

    this.initDefaultSystems();
    this.getSystem("scene").start();
  }

  debug() {
    this.context.scene.debugLayer.show({ embedMode: true });
  }

  initDefaultSystems() {
    // order matters here since context is updated between systems
    // for example shape depends on context.scene
    this.registerSystem(new SystemScene());
    this.registerSystem(new SystemShape());
    this.registerSystem(new SystemBroker());
    this.registerSystem(new SystemAttendance());
  }
}
