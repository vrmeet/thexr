import type { IComponent } from "./icomponent";
import type { XRS } from "./xrs";
import type * as BABYLON from "babylonjs";

export class Entity {
  public transformable: BABYLON.TransformNode | BABYLON.AbstractMesh;
  constructor(public name: string, public xrs: XRS) {}
  components: Record<string, IComponent> = {};
  addComponent(componentName: string, componentData) {
    const system = this.xrs.getSystem(componentName);
    if (system) {
      const component = system.buildComponent();
      this.components[componentName] = component;
      component.add(this, componentData);
    } else {
      console.error("Unregistered System", componentName);
    }
  }
  updateComponent(componentName: string, componentData) {
    const component = this.components[componentName];
    if (component) {
      component.update(componentData);
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
    const component = this.components[componentName];
    if (component) {
      component.remove();
    }
    delete this.components[componentName];
  }
  dispose() {
    Object.keys(this.components).forEach((componentName) =>
      this.removeComponent(componentName)
    );
  }
}
