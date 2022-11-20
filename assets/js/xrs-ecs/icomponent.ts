import type { Entity } from "./entity";

export interface IComponent {
  add: (target: Entity, data: any) => void;
  update: (data: any) => void;
  remove: () => void;
}
