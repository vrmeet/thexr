import type { Entity } from "./entity";
import type { IComponent } from "./icomponent";
import type { ISystem } from "./isystem";

export abstract class BaseComponent implements IComponent {
  constructor(public system: ISystem) {}
  abstract add(target: Entity, data: any): void;
  abstract update(data: any): void;
  abstract remove(): void;
}
