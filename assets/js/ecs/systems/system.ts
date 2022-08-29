import type { Context } from "../../context";
import type { Entity } from "../entities/entity";

export interface ISystem {
  name: string;
  init: (context: Context) => void;
  initEntity?: (entity: Entity) => void;
  dispose: () => void;
}
