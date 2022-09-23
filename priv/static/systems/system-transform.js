class SystemTransform {
  constructor() {
    this.transforms = {};
    this.name = "system-transform";
  }
  init(context) {
    this.scene = context.scene;
  }
  initEntity(entity_id, components) {
    const mesh = this.scene.getMeshByName(entity_id);
    if (mesh) {
      this.transforms[entity_id] = mesh;
    } else {
      const transformNode = this.scene.getTransformNodeByName(entity_id);
      if (transformNode) {
        this.transforms[entity_id] = transformNode;
      }
    }
    if (!this.transforms[entity_id]) {
      return;
    }
    this.setPosition(entity_id, components);
    this.setRotation(entity_id, components);
    this.setScaling(entity_id, components);
  }
  setPosition(entity_id, components) {
    if (components.position) {
      this.transforms[entity_id].position.fromArray(components.position);
    }
  }
  setRotation(entity_id, components) {
    if (components.rotation) {
      this.transforms[entity_id].rotation.fromArray(components.rotation);
    }
  }
  setScaling(entity_id, components) {
    if (components.scaling) {
      this.transforms[entity_id].scaling.fromArray(components.scaling);
    }
  }
  dispose() {
  }
}
window["system-transform"] = new SystemTransform();
