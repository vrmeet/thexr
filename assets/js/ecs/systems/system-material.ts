import type { Entity } from "../entities/entity";
import * as BABYLON from "babylonjs";
import * as MAT from "babylonjs-materials";

import type { ISystem } from "./system";
import type { Context } from "../../context";
import type { MaterialComponent } from "../components/material";

export class SystemMaterial implements ISystem {
  public entities: { [entity_name: string]: Entity } = {};
  public materials: { [material_name: string]: BABYLON.Material } = {};
  public name = "material";
  public scene: BABYLON.Scene;

  init(context: Context) {
    this.scene = context.scene;
  }

  initEntity(entity: Entity) {
    if (entity.componentObj.material) {
      this.entities[entity.name] = entity;
      const mat = this.findOrCreateMaterial(entity.componentObj.material);
      this.assignMaterial(mat, entity);
    }
  }

  assignMaterial(mat: BABYLON.Material, entity: Entity) {
    if (entity.transformNode?.getClassName().includes("Mesh")) {
      const mesh = entity.transformNode as BABYLON.AbstractMesh;
      mesh.material = mat;
    }
  }

  findOrCreateMaterial(MaterialComponent: MaterialComponent): BABYLON.Material {
    if (MaterialComponent.name === "color") {
      return this.findOrCreateColor(MaterialComponent.color_string);
    } else if (MaterialComponent.name === "grid") {
      return this.findOrCreateGrid();
    }
  }

  findOrCreateColor(colorString: string) {
    const matName = `mat_${colorString}`;
    if (this.materials[matName]) {
      return this.materials[matName];
    }
    const myMaterial = new BABYLON.StandardMaterial(matName, this.scene);
    const color = BABYLON.Color3.FromHexString(colorString);
    myMaterial.diffuseColor = color;
    this.materials[matName] = myMaterial;
    return myMaterial;
  }

  findOrCreateGrid() {
    const matName = "mat_grid";
    if (this.materials[matName]) {
      return this.materials[matName];
    }
    const myMaterial = new MAT.GridMaterial(matName, this.scene);
    this.materials[matName] = myMaterial;
    return myMaterial;
  }

  dispose() {}
}
