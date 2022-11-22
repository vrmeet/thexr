import type { XRS } from "./xrs";
import type * as BABYLON from "babylonjs";
import type { ISystem } from "./system";

export class Entity {
  public transformable: BABYLON.TransformNode | BABYLON.AbstractMesh;
  constructor(public name: string, public xrs: XRS) {}
  components: { [componentName: string]: ISystem } = {};
  addComponent(componentName: string, componentData) {
    const system = this.xrs.getSystem(componentName);

    if (system) {
      this.components[system.name] = system;
      system.addBehavior(this, componentData);
    } else {
      console.error("Unregistered System", componentName);
    }
  }
  updateComponent(componentName: string, componentData) {
    const system = this.components[componentName];
    if (system) {
      system.updateBehavior(this, componentData);
    } else {
      console.error(
        "Cannot update non-existant component",
        componentName,
        "on entity",
        this.name
      );
    }
  }
  removeComponent(componentName: string) {
    const system = this.components[componentName];
    if (system) {
      system.removeBehavior(this);
    }
    delete this.components[componentName];
  }
  dispose() {
    Object.keys(this.components).forEach((componentName) =>
      this.removeComponent(componentName)
    );
  }
}
