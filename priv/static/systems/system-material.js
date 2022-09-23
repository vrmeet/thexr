import * as BABYLON from "babylonjs";
import * as MAT from "babylonjs-materials";
export class SystemMaterial {
  constructor() {
    this.entities = {};
    this.materials = {};
    this.name = "material";
  }
  init(context) {
    this.scene = context.scene;
  }
  initEntity(entity) {
    if (entity.componentObj.material) {
      this.entities[entity.name] = entity;
      const mat = this.findOrCreateMaterial(entity.componentObj.material);
      this.assignMaterial(mat, entity);
    }
  }
  assignMaterial(mat, entity) {
    var _a;
    if ((_a = entity.transformNode) == null ? void 0 : _a.getClassName().includes("Mesh")) {
      const mesh = entity.transformNode;
      mesh.material = mat;
    }
  }
  findOrCreateMaterial(MaterialComponent) {
    if (MaterialComponent.name === "color") {
      return this.findOrCreateColor(MaterialComponent.color_string);
    } else if (MaterialComponent.name === "grid") {
      return this.findOrCreateGrid();
    }
  }
  findOrCreateColor(colorString) {
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
  dispose() {
  }
}
