class SystemMaterial {
  constructor() {
    this.materials = {};
    this.name = "system-material";
  }
  init(context) {
    this.context = context;
    this.scene = context.scene;
  }
  initEntity(entity_id, components) {
    if (components.material) {
      const mat = this.findOrCreateMaterial(components.material);
      this.assignMaterial(mat, entity_id);
    }
  }
  findOrCreateMaterial(MaterialComponent) {
    if (MaterialComponent.name === "color") {
      return this.findOrCreateColor(MaterialComponent.color_string);
    } else if (MaterialComponent.name === "grid") {
      return this.findOrCreateGrid();
    }
  }
  assignMaterial(mat, entity_id) {
    const mesh = this.scene.getMeshByName(entity_id);
    if (mesh) {
      mesh.material = mat;
    }
  }
  findOrCreateColor(colorString) {
    const matName = `mat_${colorString}`;
    if (this.materials[matName]) {
      return this.materials[matName];
    }
    const myMaterial = new this.context.BABYLON.StandardMaterial(matName, this.scene);
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
  dispose() {
  }
}
window["system-material"] = new SystemMaterial();
