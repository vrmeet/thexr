import type { Entity } from "../entities/entity";
import * as BABYLON from "babylonjs";
import { cap } from "../../utils/misc";

import type { ISystem } from "./system";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ShapeComponent } from "../components/shape";

export class SystemShape implements ISystem {
  public meshes = {};
  public name = "shape";
  public scene: BABYLON.Scene;
  init(context: Context) {
    this.scene = context.scene;
  }

  initEntity(entity_id: string, components: ComponentObj) {
    if (components.shape) {
      this.meshes[entity_id] = this.createMesh(entity_id, components.shape);
    }
  }

  createMesh(entity_id: string, shapeComponent: ShapeComponent) {
    if (
      ["box", "sphere", "cylinder", "plane", "capsule"].includes(
        shapeComponent.prim
      )
    ) {
      const builderFunction = `Create${cap(shapeComponent.prim)}`;
      const builderOptions = { ...shapeComponent.prim_params };
      if (shapeComponent.prim === "plane") {
        builderOptions["sideOrientation"] = BABYLON.Mesh.DOUBLESIDE;
      }
      return BABYLON.MeshBuilder[builderFunction](
        entity_id,
        builderOptions,
        this.scene
      );
    } else {
      throw new Error("unsupported shape");
    }
  }

  dispose() {}
}
