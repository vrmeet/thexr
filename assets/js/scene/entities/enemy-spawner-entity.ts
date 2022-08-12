import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import { findOrCreateMaterial } from "../../utils";
import type { Component } from "../../types";

export class EnemySpawnerEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("enemy_spawner", scene)

    }

    defaultComponentAsObject(): Record<string, any> {
        return {
            position: this.cameraFrontFloorPosition(),
            color: "#F01100",
            editable: true
        }
    }


    createMesh() {
        return BABYLON.MeshBuilder.CreateBox(this.name, { width: 1.2, depth: 1.2, height: 0.03 }, this.scene)
    }
}