import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";

export interface ISystem {
  name: string;
  order: number;
  init(context: Context): void;

  registerEntity?(entity_id: string, components: ComponentObj): void;
  upsertComponents?(entity_id: string, components: ComponentObj): void;
  deregisterEntity?(entity_id: string): void;
}
