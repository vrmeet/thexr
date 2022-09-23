var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
class SystemShape {
  constructor() {
    this.meshes = {};
    this.name = "system-shape";
  }
  init(context) {
    this.context = context;
  }
  initEntity(entity_id, components) {
    if (components.shape) {
      this.meshes[entity_id] = this.createMesh(entity_id, components.shape);
    }
  }
  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  createMesh(entity_id, shapeComponent) {
    if (["box", "sphere", "cylinder", "plane", "capsule"].includes(shapeComponent.prim)) {
      const builderFunction = `Create${this.capitalize(shapeComponent.prim)}`;
      const builderOptions = __spreadValues({}, shapeComponent.prim_params);
      if (shapeComponent.prim === "plane") {
        builderOptions["sideOrientation"] = this.context.BABYLON.Mesh.DOUBLESIDE;
      }
      return this.context.BABYLON.MeshBuilder[builderFunction](entity_id, builderOptions, this.context.scene);
    } else {
      throw new Error("unsupported shape");
    }
  }
  dispose() {
  }
}
window["system-shape"] = new SystemShape();
