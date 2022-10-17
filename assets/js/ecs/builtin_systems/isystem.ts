import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";

export interface ISystem {
  name: string;
  order: number;
  init(context: Context): void;

  registerEntity?(entity_id: string, components: ComponentObj): any;
  upsertComponents?(entity_id: string, components: ComponentObj): any;
  deregisterEntity?(entity_id: string): any;
  process_msg?(data: any): void;
}
