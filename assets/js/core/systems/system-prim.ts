/*
System prim will create a babylon meshbuilder 'primative'
*/
import * as BABYLON from "babylonjs";
import type { Entity } from "../entities/entity";

export class SystemPrim {
  public name = "primitive";
  public entity: Entity;
  init() {}
  cap(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  attach(entity: Entity) {
    this.entity = entity;
    let builderFunction = `Create${this.cap(entity.componentObj.shape.prim)}`;
    let builderOptions = entity.componentObj.shape.prim_params;
    entity.mesh = BABYLON.MeshBuilder[builderFunction](
      entity.name,
      builderOptions,
      entity.scene
    );
  }
  detach() {
    if (this.entity.mesh) {
      this.entity.mesh.dispose();
      this.entity.mesh = null;
    }
  }
}
