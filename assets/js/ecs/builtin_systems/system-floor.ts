import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import type { SystemXR } from "./system-xr";

export class SystemFloor implements ISystem {
  public name = "system-floor";
  public order = 30;
  public context: Context;
  public systemXR: SystemXR;
  init(context: Context) {
    this.context = context;
    this.systemXR = this.context.systems["system-xr"] as SystemXR;
  }
  registerEntity(entity_id: string, components: ComponentObj): void {
    if (components.acts_like_floor !== undefined) {
      const mesh = this.context.scene.getMeshByName(entity_id);
      if (mesh) {
        this.systemXR.teleportation.addFloorMesh(mesh);
      }
    }
  }
  upsertComponents(_entity_id: string, components: ComponentObj): void {}
  deregisterEntity(entity_id: string): void {
    const mesh = this.context.scene.getMeshByName(entity_id);
    if (mesh) {
      this.systemXR.teleportation.removeFloorMesh(mesh);
    }
  }
}
