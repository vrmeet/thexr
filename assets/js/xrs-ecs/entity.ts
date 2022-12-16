import type { XRS } from "./xrs";
import type * as BABYLON from "babylonjs";
import type { ISystem } from "./system";
import type { ComponentObj } from "../ecs/components/component-obj";

export class Entity {
  public transformable: BABYLON.TransformNode | BABYLON.AbstractMesh;
  constructor(public name: string, public xrs: XRS) {}
  componentSystems: { [componentName: string]: ISystem } = {};
  componentData() {
    return Object.keys(this.componentSystems).reduce((acc, componentName) => {
      acc[componentName] = this.getComponentBehaviorData(componentName);
      return acc;
    }, {});
  }
  getComponentBehaviorData(componentName: string) {
    return this.componentSystems[componentName]?.getBehaviorData(this);
  }
  hasComponent(componentName: string) {
    return this.componentSystems[componentName] !== undefined;
  }
  addComponent(componentName: string, componentData) {
    const system = this.xrs.getSystem(componentName);

    if (system) {
      this.componentSystems[system.name] = system;
      system.addBehavior(this, componentData);
    } else {
      console.error("Unregistered System", componentName);
    }
  }
  updateComponent(componentName: string, componentData) {
    const system = this.componentSystems[componentName];
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
    const system = this.componentSystems[componentName];
    if (system) {
      system.removeBehavior(this);
    }
    delete this.componentSystems[componentName];
  }

  upsertComponents(componentSystems: ComponentObj) {
    this.xrs
      .sortComponentsBySystemOrder(componentSystems)
      .forEach((component) => {
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
            this.addComponent(
              component.componentName,
              component.componentValue
            );
          }
        }
      });
  }

  dispose() {
    Object.keys(this.componentSystems).forEach((componentName) =>
      this.removeComponent(componentName)
    );
  }
}
