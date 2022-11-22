import type { Entity } from "./entity";
import type { XRS } from "./xrs";

export interface IBehavior {
  data: any;
  add(entity: Entity, data: any): void;
  update(data: any): void;
  remove(): void;
  pause?(): void;
  resume?(): void;
}

export interface ISystem {
  name: string;
  order?: number;
  schema?: any;
  setup(xrs: XRS): void;
  start?(): void;
  pause?(): void;
  tearDown?(): void;
  addBehavior?(entity: Entity, data): void;
  updateBehavior?(entity: Entity, data): void;
  removeBehavior?(entity: Entity): void;
  pauseBehavior?(entity: Entity): void;
  resumeBehavior?(entity: Entity): void;
}

export abstract class BaseSystemWithBehaviors implements ISystem {
  abstract name: string;
  public order = 5;
  public xrs: XRS;
  public schema = { prim: { type: "string" }, prim_params: {} }; // unused
  public entities: Record<string, IBehavior> = {};
  setup(xrs: XRS) {
    this.xrs = xrs;
  }
  abstract buildBehavior(): IBehavior;
  addBehavior(entity: Entity, data: any): void {
    const behavior = this.buildBehavior();
    this.entities[entity.name] = behavior;
    behavior.add(entity, data);
  }

  updateBehavior(entity: Entity, data: any): void {
    this.entities[entity.name].update(data);
  }
  removeBehavior(entity: Entity): void {
    this.entities[entity.name].remove();
    delete this.entities[entity.name];
  }
}
