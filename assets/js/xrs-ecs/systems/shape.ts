import * as BABYLON from "babylonjs";
import { BaseComponent } from "../base-component";
import { BaseSystem } from "../base-system";
import type { Entity } from "../entity";

export class ComponentShape extends BaseComponent {
  public entity: Entity;
  public data: { shape: string; options: any };
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
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  createMesh() {
    if (
      ["box", "sphere", "cylinder", "plane", "capsule"].includes(
        this.data.shape
      )
    ) {
      const builderFunction = `Create${this.capitalize(this.data.shape)}`;
      const builderOptions = this.data.options;

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

export class SystemShape extends BaseSystem {
  public name = "shape";
  public order = 1;
  buildComponent() {
    return new ComponentShape(this);
  }
}
