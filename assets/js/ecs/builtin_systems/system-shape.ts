import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ShapeComponent } from "../components/shape";
import type { ISystem } from "./isystem";

export class SystemShape implements ISystem {
  public meshes: Record<string, BABYLON.AbstractMesh> = {};
  public name = "system-shape";
  public order = 0;
  public context: Context;
  init(context: Context) {
    this.context = context;
  }

  registerEntity(entity_id: string, components: ComponentObj) {
    if (components.shape) {
      if (!this.meshes[entity_id]) {
        this.meshes[entity_id] = this.createMesh(entity_id, components.shape);
      }
    }
  }

  upsertComponents(entity_id: string, components: ComponentObj): void {
    if (
      components.shape !== undefined &&
      this.meshes[entity_id] !== undefined
    ) {
      // recreate the mesh
      this.meshes[entity_id].dispose();
      this.meshes[entity_id] = this.createMesh(entity_id, components.shape);
    }
  }

  deregisterEntity(entity_id: string): void {
    if (this.meshes[entity_id] !== undefined) {
      this.meshes[entity_id].dispose();
      delete this.meshes[entity_id];
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