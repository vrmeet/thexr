import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs";

export class SpawnPointEntity extends EntityBase {
  constructor(public scene: BABYLON.Scene) {
    super("spawn_point", scene);
  }

  defaultComponentAsObject(): Record<string, any> {
    return {
      position: this.cameraFrontFloorPosition(),
      color: "#00FF00",
      editable: true,
    };
  }

  createMesh() {
    return BABYLON.MeshBuilder.CreateBox(
      this.name,
      { width: 1, depth: 1, height: 0.05 },
      this.scene
    );
  }
}
