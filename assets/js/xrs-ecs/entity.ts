import type { XRS } from "./xrs";
import type * as BABYLON from "babylonjs";
import type { ISystem } from "./system";
import type { ComponentObj } from "../ecs/components/component-obj";

export class Entity {
  public transformable: BABYLON.TransformNode | BABYLON.AbstractMesh;
  constructor(public name: string, public xrs: XRS) {}
  components: { [componentName: string]: ISystem } = {};
  getComponentBehaviorData(componentName: string) {
    return this.components[componentName]?.getBehaviorData(this);
  }
  hasComponent(componentName: string) {
    return this.components[componentName] !== undefined;
  }
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

  upsertComponents(components: ComponentObj) {
    this.xrs.sortComponentsBySystemOrder(components).forEach((component) => {
      if (this.hasComponent(component.componentName)) {
        if (component.componentValue === null) {
          this.removeComponent(component.componentName);
        } else {
          this.updateComponent(
            component.componentName,
            component.componentValue
          );
        }
      } else {
        if (component.componentValue !== null) {
          this.addComponent(component.componentName, component.componentValue);
        }
      }
    });
  }

  dispose() {
    Object.keys(this.components).forEach((componentName) =>
      this.removeComponent(componentName)
    );
  }
}
