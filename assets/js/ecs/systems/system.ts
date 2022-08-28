import type { Entity } from "../entities/entity";

export interface ISystem {
  name: string;
  init: () => void;
  initEntity?: (entity: Entity) => void;
  dispose: () => void;
}
