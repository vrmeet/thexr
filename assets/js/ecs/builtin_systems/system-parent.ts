import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";

export class SystemParent implements ISystem {
  public name = "system-parent";
  public order = 4;
  public context: Context;
  init(context: Context) {
    this.context = context;
  }
  registerEntity(entity_id: string, components: ComponentObj): void {
    if (components.parent !== undefined) {
      const parent = this.context.scene.getMeshByName(components.parent);
      const child = this.context.scene.getMeshByName(entity_id);
      if (parent && child) {
        child.parent = parent;
      }
    }
  }
  upsertComponents(_entity_id: string, _components: ComponentObj): void {}
  deregisterEntity(_entity_id: string): void {}
}
