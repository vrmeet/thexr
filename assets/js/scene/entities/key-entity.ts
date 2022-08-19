import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs";

export class KeyEntity extends EntityBase {
  constructor(public scene: BABYLON.Scene) {
    super("key", scene);
  }

  defaultComponentAsObject(): Record<string, any> {
    return {
      position: this.cameraFrontPosition(),
      editable: true,
      interactable: true,
      collectable: true,
    };
  }

  createMesh() {
    return BABYLON.MeshBuilder.CreateBox(
      this.name,
      { width: 0.15, depth: 0.01, height: 0.2 },
      this.scene
    );
  }
}
