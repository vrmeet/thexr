import type { Entity } from "../entities/entity";
import * as BABYLON from "babylonjs";
import { cap } from "../../utils/misc";

import type { ISystem } from "./system";
import type { Context } from "../../context";

export class SystemShape implements ISystem {
  public entities: { [entity_name: string]: Entity } = {};
  public name = "shape";
  public scene: BABYLON.Scene;
  init(context: Context) {
    console.log("sysem shap init");
    this.scene = context.scene;
  }

  initEntity(entity: Entity) {
    if (entity.componentObj.shape) {
      this.entities[entity.name] = entity;
      this.createMesh(entity);
    }
  }

  createMesh(entity: Entity) {
    if (
      ["box", "sphere", "cylinder", "plane", "capsule"].includes(
        entity.componentObj.shape.prim
      )
    ) {
      const builderFunction = `Create${cap(entity.componentObj.shape.prim)}`;
      const builderOptions = entity.componentObj.shape.prim_params;
      entity.transformNode = BABYLON.MeshBuilder[builderFunction](
        entity.name,
        builderOptions,
        entity.scene
      );
    } else {
      throw new Error("unsupported shape");
    }
  }

  dispose() {}
}
