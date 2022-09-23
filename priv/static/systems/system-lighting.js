class SystemLighting {
  constructor() {
    this.lights = {};
    this.name = "lighting";
  }
  init(context) {
    this.context = context;
    this.scene = context.scene;
  }
  initEntity(entity_id, components) {
    if (components.lighting) {
      this.lights[entity_id] = this.createLight(entity_id, components);
    }
  }
  createLight(entity_id, components) {
    return new this.context.BABYLON.HemisphericLight(entity_id, new this.context.BABYLON.Vector3(0, 1, 0), this.scene);
  }
  dispose() {
  }
}
window["system-lighting"] = new SystemLighting();
