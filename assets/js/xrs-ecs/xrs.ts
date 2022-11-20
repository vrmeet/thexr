import { defaultContext, type Context, type OPTS } from "./context";
import { Entity } from "./entity";
import type { ISystem } from "./isystem";
import { SystemScene } from "./systems/scene";
import { SystemShape } from "./systems/shape";

export class XRS {
  public context: Context;

  constructor() {
    this.context = defaultContext();
  }

  init(opts: Partial<OPTS>) {
    this.context = Object.assign(this.context, opts);
    if (!this.context.my_nickname) {
      this.context.my_nickname = this.context.my_member_id;
    }

    this.initDefaultSystems();
    (this.getSystem("scene") as SystemScene).run();
  }

  debug() {
    this.context.scene.debugLayer.show({ embedMode: true });
  }

  initDefaultSystems() {
    // order matters here since context is updated between systems
    // for example shape depends on context.scene
    this.registerSystem(new SystemScene());
    this.registerSystem(new SystemShape());
  }

  registerSystem(sys: ISystem) {
    if (!sys.name) {
      throw new Error("Invalid System Name");
    }
    sys.init(this);
    this.context.systems[sys.name] = sys;
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
}
