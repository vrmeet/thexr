import type { Entity } from "../entities/entity";
import * as BABYLON from "babylonjs";
import { cap } from "../../utils/misc";

export class SystemShape {
  public entities: { [id: string]: Entity };
  public scene: BABYLON.Scene;

  constructor() {
    this.entities = {};
  }

  init(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  initEntity(entity: Entity) {
    if (!entity.componentObj.shape) {
      entity.mesh = BABYLON.MeshBuilder.CreateBox(
        entity.name,
        { size: 0.2 },
        this.scene
      );
    } else {
      let builderFunction = `Create${cap(entity.componentObj.shape.prim)}`;
      let builderOptions = entity.componentObj.shape.prim_params;
      entity.mesh = BABYLON.MeshBuilder[builderFunction](
        entity.name,
        builderOptions,
        entity.scene
      );
    }
  }
}

export const systemShape = new SystemShape();
