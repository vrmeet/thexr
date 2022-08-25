import type * as BABYLON from "babylonjs";
import type { ComponentObj } from "../components/component-obj";
import { systems } from "../systems/systems";
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
    systems.initEntityAll(this);
  }

  dispose() {
    if (this.mesh) {
      this.mesh.dispose();
    }
  }
}
