import type { Entity } from "../entity";
import { BaseSystemWithBehaviors, type IBehavior } from "../system";
import type { XRS } from "../xrs";
import * as BABYLON from "babylonjs";
import * as MAT from "babylonjs-materials";

export class SystemMaterial extends BaseSystemWithBehaviors {
  name = "material";
  public callWhenModelChanges = true;
  public materials: { [material_name: string]: BABYLON.Material } = {};
  // keep track of entities using material name so that
  // if no one is using the material it can be pruned
  public entitiesToMaterials: Record<string, string> = {};
  buildBehavior() {
    return new BehaviorMaterial(this.xrs, this);
  }
  findOrCreateColor(colorString: string) {
    const matName = `mat_${colorString}`;
    if (this.materials[matName]) {
      return this.materials[matName];
    }
    const myMaterial = new BABYLON.StandardMaterial(
      matName,
      this.xrs.context.scene
    );
    const color = BABYLON.Color3.FromHexString(colorString);
    myMaterial.diffuseColor = color;
    return myMaterial;
  }

  findOrCreateGrid() {
    const matName = "mat_grid";
    if (this.materials[matName]) {
      return this.materials[matName];
    }
    const myMaterial = new MAT.GridMaterial(matName, this.xrs.context.scene);
    return myMaterial;
  }

  pruneMaterial(materialName: string) {
    if (!Object.values(this.entitiesToMaterials).includes(materialName)) {
      // no one else is using this material, so remove the material too
      this.materials[materialName].dispose();
      delete this.materials[materialName];
    }
  }
}

type MaterialType = { name: "color"; color_string: string } | { name: "grid" };

export class BehaviorMaterial implements IBehavior {
  public data: MaterialType;
  public entity: Entity;

  constructor(public xrs: XRS, public system: SystemMaterial) {}
  add(entity: Entity, data: MaterialType): void {
    this.entity = entity;
    this.data = data;
    const mat = this.findOrCreateMaterial();
    //save material
    if (this.system.materials[mat.name] === undefined) {
      this.system.materials[mat.name] = mat;
    }
    this.assignMaterial(mat);
  }
  update(data: MaterialType): void {
    const oldMaterialName = this.system.entitiesToMaterials[this.entity.name];
    this.data = data;
    const mat = this.findOrCreateMaterial();
    //save material
    if (this.system.materials[mat.name] === undefined) {
      this.system.materials[mat.name] = mat;
    }
    this.assignMaterial(mat);
    if (oldMaterialName) {
      this.system.pruneMaterial(oldMaterialName);
    }
  }
  remove(): void {
    const materialName = this.system.entitiesToMaterials[this.entity.name];
    delete this.system.entitiesToMaterials[this.entity.name];
    this.system.pruneMaterial(materialName);
  }
  assignMaterial(mat: BABYLON.Material) {
    const mesh = this.entity.getFirstMesh();

    if (mesh) {
      mesh.material = mat;
    } else {
      console.warn("no mesh to assign material to");
    }
    this.system.entitiesToMaterials[this.entity.name] = mat.name;
  }
  findOrCreateMaterial(): BABYLON.Material {
    if (this.data.name === "color") {
      return this.system.findOrCreateColor(this.data.color_string);
    } else if (this.data.name === "grid") {
      return this.system.findOrCreateGrid();
    } else {
      console.error("material component requires a name", this.data);
    }
  }
}
