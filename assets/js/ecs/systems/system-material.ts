import type * as BABYLON from "babylonjs";
import type { ISystem } from "../system";
import type { Context } from "../../context";
import type { MaterialComponent } from "../components/material";
import type { ComponentObj } from "../components/component-obj";

class SystemMaterial implements ISystem {
  public materials: { [material_name: string]: BABYLON.Material } = {};
  public name = "system-material";
  public scene: BABYLON.Scene;
  public context: Context;
  init(context: Context) {
    this.context = context;
    this.scene = context.scene;
  }

  initEntity(entity_id: string, components: ComponentObj) {
    if (components.material) {
      const mat = this.findOrCreateMaterial(components.material);
      this.assignMaterial(mat, entity_id);
    }
  }

  findOrCreateMaterial(MaterialComponent: MaterialComponent): BABYLON.Material {
    if (MaterialComponent.name === "color") {
      return this.findOrCreateColor(MaterialComponent.color_string);
    } else if (MaterialComponent.name === "grid") {
      return this.findOrCreateGrid();
    }
  }

  assignMaterial(mat: BABYLON.Material, entity_id: string) {
    const mesh = this.scene.getMeshByName(entity_id);
    if (mesh) {
      mesh.material = mat;
    }
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
    this.materials[matName] = myMaterial;
    return myMaterial;
  }

  findOrCreateGrid() {
    const matName = "mat_grid";
    if (this.materials[matName]) {
      return this.materials[matName];
    }
    const myMaterial = new this.context.MAT.GridMaterial(matName, this.scene);
    this.materials[matName] = myMaterial;
    return myMaterial;
  }

  dispose() {}
}

window["system-material"] = new SystemMaterial();
