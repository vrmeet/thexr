import * as BABYLON from "babylonjs";
import type { ComponentObj } from "../components/component-obj";
// import { SystemDoor } from "../systems/system-door";

export class Entity
  implements BABYLON.IBehaviorAware<Entity>, BABYLON.IDisposable
{
  public behaviors: Record<string, BABYLON.Behavior<Entity>>;

  public mesh: BABYLON.AbstractMesh;

  constructor(
    public name: string,
    public componentObj: ComponentObj,
    public scene: BABYLON.Scene
  ) {
    this.behaviors = {};
    this.parse(this);
    // let ds = new SystemDoor();
    // ds.parseEntity(this);

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

  addBehavior(behavior: BABYLON.Behavior<Entity>): Entity {
    if (this.behaviors[behavior.name]) {
      return;
    }
    this.behaviors[behavior.name] = behavior;
    behavior.init();
    behavior.attach(this);
    return this;
  }

  getBehaviorByName(name: string): BABYLON.Behavior<Entity> {
    return this.behaviors[name];
  }

  removeBehavior(behavior: BABYLON.Behavior<Entity>): Entity {
    if (!this.behaviors[behavior.name]) {
      return;
    }
    this.behaviors[behavior.name].detach();
    delete this.behaviors[behavior.name];
    return this;
  }

  dispose() {
    Object.values(this.behaviors).forEach(behavior => behavior.detach());
    if (this.mesh) {
      this.mesh.dispose();
    }
  }
}
