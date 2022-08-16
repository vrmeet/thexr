import * as BABYLON from "babylonjs";
import { parse } from "graphql";
import type { ComponentObj } from "../components/component-obj";

// import type { System, ISystemAware } from "../systems/system";

export class Entity {
  // public systems: Record<string, System<Entity>>;

  public mesh: BABYLON.AbstractMesh;

  constructor(
    public name: string,
    public componentObj: ComponentObj,
    public scene: BABYLON.Scene
  ) {
    this.parse(this);
    // this.systems = {};
    // if (componentObj.shape) {
    //   // attach shape component to this entity
    //   this.addSystem();
    // } else {
    //   let mesh = BABYLON.MeshBuilder.CreateBox(
    //     this.name,
    //     { size: 0.2 },
    //     this.scene
    //   );
    // }
  }

  // imagine this is shape parse
  parse(entity: Entity) {
    if (entity.componentObj.shape) {
      switch (entity.componentObj.shape.prim) {
        case "box":
          entity.mesh = BABYLON.MeshBuilder.CreateBox(
            entity.name,
            entity.componentObj.shape.prim_params,
            this.scene
          );
      }
    } else {
      entity.mesh = BABYLON.MeshBuilder.CreateBox(
        entity.name,
        { size: 0.2 },
        this.scene
      );
    }
  }

  // addComponent(component: Component<Entity>): Entity {
  //   if (this.components[component.name]) {
  //     return;
  //   }
  //   this.components[component.name] = component;
  //   component.init();
  //   component.attach(this);
  //   return this;
  // }

  // getComponentByName(name: string): Component<Entity> {
  //   return this.components[name];
  // }

  // removeComponent(name: string): Entity {
  //   if (!this.components[name]) {
  //     return;
  //   }
  //   this.components[name].detach();
  //   delete this.components[name];
  //   return this;
  // }
}
