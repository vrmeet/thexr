import * as BABYLON from "babylonjs";
import type { Entity } from "../entity";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";
import type { XRS } from "../xrs";

export class BehaviorShape implements IBehavior {
  public entity: Entity;
  public data: { prim: string; prim_params: any };
  constructor(public system: SystemShape) {}
  add(target: Entity, data: typeof this.data) {
    // creates a mesh
    this.entity = target;
    this.data = data;

    this.createMesh();
  }
  copyPosRotScale(
    mesh: BABYLON.AbstractMesh,
    transformable: BABYLON.TransformNode | BABYLON.AbstractMesh
  ) {
    if (!transformable) {
      return;
    }
    mesh.position.copyFrom(transformable.position);
    mesh.rotationQuaternion.copyFrom(transformable.rotationQuaternion);
    mesh.scaling.copyFrom(this.entity.transformable.scaling);
  }
  update(data: typeof this.data) {
    // replaces a mesh, but keep same pos,rot,scale
    this.data = data;
    this.createMesh();
  }
  remove() {
    // removes the mesh
    this.entity.transformable?.dispose();
  }
  capitalize(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }
  createMesh() {
    if (
      ["box", "sphere", "cylinder", "plane", "capsule", "ground"].includes(
        this.data.prim
      )
    ) {
      const builderFunction = `Create${this.capitalize(this.data.prim)}`;
      const builderOptions = this.data.prim_params;
      if (this.data.prim === "plane") {
        builderOptions["sideOrientation"] = BABYLON.Mesh.DOUBLESIDE;
      }
      const mesh = BABYLON.MeshBuilder[builderFunction](
        this.entity.name,
        builderOptions
      );
      mesh.rotationQuaternion = new BABYLON.Quaternion();
      this.copyPosRotScale(mesh, this.entity.transformable);
      this.entity.transformable?.dispose();
      this.entity.transformable = mesh;
    } else {
      throw new Error("unsupported shape");
    }
  }
}

export class SystemShape extends BaseSystemWithBehaviors implements ISystem {
  public name = "shape";
  public order = 1;
  public xrs: XRS;
  public schema = { prim: { type: "string" }, prim_params: {} }; // unused

  buildBehavior(): IBehavior {
    return new BehaviorShape(this);
  }
}
