import type * as BABYLON from "babylonjs";
import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";

export class SystemMaterial implements ISystem {
  public materials: { [material_name: string]: BABYLON.Material } = {};
  public entities: Record<string, string> = {}; // entity_id to material name mapping
  public name = "material";
  public order = 3;
  public scene: BABYLON.Scene;
  public context: Context;
  init(context: Context) {
    this.context = context;
    this.scene = context.scene;
  }

  registerEntity(entity_id: string, components: ComponentObj) {
    if (components.material) {
      const mat = this.findOrCreateMaterial(components.material);
      //save material
      if (this.materials[mat.name] === undefined) {
        this.materials[mat.name] = mat;
      }
      this.assignMaterial(mat, entity_id);
    }
  }

  upsertComponents(entity_id: string, components: ComponentObj): void {
    if (
      components.material != undefined &&
      this.entities[entity_id] !== undefined
    ) {
      const oldMaterialName = this.entities[entity_id];
      const mat = this.findOrCreateMaterial(components.material);
      //save material
      if (this.materials[mat.name] === undefined) {
        this.materials[mat.name] = mat;
      }
      this.assignMaterial(mat, entity_id);
      this.pruneMaterial(oldMaterialName);
    }
  }

  deregisterEntity(entity_id: string): void {
    if (this.entities[entity_id] !== undefined) {
      const materialName = this.entities[entity_id];
      delete this.entities[entity_id];
      this.pruneMaterial(materialName);
    }
  }

  pruneMaterial(materialName: string) {
    if (!Object.values(this.entities).includes(materialName)) {
      // no one else is using this material, so remove the material too
      this.materials[materialName].dispose();
      delete this.materials[materialName];
    }
  }

  findOrCreateMaterial(component: ComponentObj["material"]): BABYLON.Material {
    if (component.name === "color") {
      return this.findOrCreateColor(component.color_string);
    } else if (component.name === "grid") {
      return this.findOrCreateGrid();
    } else {
      console.error("material component requires a name", component);
    }
  }

  assignMaterial(mat: BABYLON.Material, entity_id: string) {
    const mesh = this.scene.getMeshByName(entity_id);
    if (mesh) {
      mesh.material = mat;
    }
    this.entities[entity_id] = mat.name;
  }

  findOrCreateColor(colorString: string) {
    const matName = `mat_${colorString}`;
    if (this.materials[matName]) {
      return this.materials[matName];
    }
    const myMaterial = new this.context.BABYLON.StandardMaterial(
      matName,
      this.scene
    );
    const color = this.context.BABYLON.Color3.FromHexString(colorString);
    myMaterial.diffuseColor = color;
    return myMaterial;
  }

  findOrCreateGrid() {
    const matName = "mat_grid";
    if (this.materials[matName]) {
      return this.materials[matName];
    }
    const myMaterial = new this.context.MAT.GridMaterial(matName, this.scene);
    return myMaterial;
  }

  dispose() {}
}
