import type * as BABYLON from "babylonjs";
import type { ComponentObj } from "../components/component-obj";
import { SystemDoor } from "../systems/system-door";
import { SystemPrim } from "../systems/system-prim";

/**
 * An Entity is a reference to some item in the scene, be it a door, a wall,
 * a key or an enemy.  Anything the user might need to interact with, or cause
 * an effect in the scene is an entity.
 *
 * Usually an Entity will have a direct relation to a mesh so that it can be
 * drawn in the scene.  The mesh may be hidden in (non-edit) mode so that gizmos such
 * as sound emitters do not need to be visible all the time.
 */

export class Entity implements BABYLON.IDisposable {
  public mesh: BABYLON.AbstractMesh;

  constructor(
    public name: string,
    public componentObj: ComponentObj,
    public scene: BABYLON.Scene
  ) {
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

  dispose() {
    if (this.mesh) {
      this.mesh.dispose();
    }
  }
}
