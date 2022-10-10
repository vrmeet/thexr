import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import type { SystemXR } from "./system-xr";

export class SystemFloor implements ISystem {
  public name = "floor";
  public order = 30;
  public context: Context;
  public systemXR: SystemXR;
  init(context: Context) {
    this.context = context;
    this.systemXR = this.context.systems["xr"] as SystemXR;
  }
  registerEntity(entity_id: string, components: ComponentObj): void {
    if (components.floor !== undefined) {
      const mesh = this.context.scene.getMeshByName(entity_id);
      if (mesh) {
        if (this.systemXR.teleportation !== undefined) {
          this.systemXR.teleportation.addFloorMesh(mesh);
        }
      }
    }
  }
}
