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
    this.entities[entity.name] = entity;
    this.createMesh(entity);
    this.setPosition(entity);
    this.setRotation(entity);
    this.setScaling(entity);
  }

  createMesh(entity: Entity) {
    if (!entity.componentObj.shape) {
      entity.mesh = BABYLON.MeshBuilder.CreateBox(
        entity.name,
        { size: 0.2 },
        this.scene
      );
    } else if (
      ["box", "sphere", "cylinder", "plane", "capsule"].includes(
        entity.componentObj.shape.prim
      )
    ) {
      const builderFunction = `Create${cap(entity.componentObj.shape.prim)}`;
      const builderOptions = entity.componentObj.shape.prim_params;
      entity.mesh = BABYLON.MeshBuilder[builderFunction](
        entity.name,
        builderOptions,
        entity.scene
      );
    } else {
      throw new Error("unsupported shape");
    }
    console.log("created mesh on entity", entity);
  }

  setPosition(entity) {
    if (entity.componentObj.position) {
      entity.mesh.position.fromArray(entity.componentObj.position);
    }
  }
  setRotation(entity) {
    if (entity.componentObj.rotation) {
      entity.mesh.rotation.fromArray(entity.componentObj.rotation);
    }
  }
  setScaling(entity) {
    if (entity.componentObj.scaling) {
      entity.mesh.scaling.fromArray(entity.componentObj.scaling);
    }
  }
  dispose() {}
}
