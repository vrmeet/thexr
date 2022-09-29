import type { ISystem } from "../system";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ShapeComponent } from "../components/shape";

class SystemShape implements ISystem {
  public meshes: Record<string, BABYLON.AbstractMesh> = {};
  public name = "system-shape";
  public context: Context;
  init(context: Context) {
    this.context = context;
    this.context.signalHub.incoming.on("entity_deleted").subscribe((evt) => {
      if (this.meshes[evt.id]) {
        this.meshes[evt.id].dispose();
        delete this.meshes[evt.id];
      }
    });
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

  createMesh(
    entity_id: string,
    shapeComponent: ShapeComponent
  ): BABYLON.AbstractMesh {
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
