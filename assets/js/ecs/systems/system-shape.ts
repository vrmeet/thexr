import type { ISystem } from "../system";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ShapeComponent } from "../components/shape";

class SystemShape implements ISystem {
  public meshes = {};
  public name = "system-shape";
  public context: Context;
  init(context: Context) {
    this.context = context;
  }

  initEntity(entity_id: string, components: ComponentObj) {
    if (components.shape) {
      if (!this.meshes[entity_id]) {
        this.meshes[entity_id] = this.createMesh(entity_id, components.shape);
      }
    }
  }
  capitalize(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  createMesh(entity_id: string, shapeComponent: ShapeComponent) {
    if (
      ["box", "sphere", "cylinder", "plane", "capsule"].includes(
        shapeComponent.prim
      )
    ) {
      const builderFunction = `Create${this.capitalize(shapeComponent.prim)}`;
      const builderOptions = { ...shapeComponent.prim_params };
      if (shapeComponent.prim === "plane") {
        builderOptions["sideOrientation"] =
          this.context.BABYLON.Mesh.DOUBLESIDE;
      }
      return this.context.BABYLON.MeshBuilder[builderFunction](
        entity_id,
        builderOptions,
        this.context.scene
      );
    } else {
      throw new Error("unsupported shape");
    }
  }

  dispose() {}
}
window["system-shape"] = new SystemShape();
