import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";

export interface ISystem {
  name: string;
  init: (context: Context) => void;
  initEntity?: (entity_id: string, components: ComponentObj) => void;
  dispose: () => void;
}
