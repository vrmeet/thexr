import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";

export interface ISystem {
  name: string;
  order: number;
  init(context: Context): void;

  // if you're going to implement any of these, you MUST implement all three

  registerEntity?(entity_id: string, components: ComponentObj): void;
  upsertComponents?(
    entity_id: string,
    oldComponents: ComponentObj,
    newComponents: ComponentObj
  ): void;
  deregisterEntity?(entity_id: string): void;
}
