import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import { findOrCreateMaterial } from "../../utils";
import type { Component } from "../../types";

export class SpawnPointEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("spawn_point", scene)

    }

    defaultPosition(): number[] {
        return this.cameraFrontFloorPosition()
    }

    defaultColor() {
        return "#00FF00"
    }

    defaultIsEditable(): boolean {
        return true
    }



    createMesh() {
        return BABYLON.MeshBuilder.CreateBox(this.name, { width: 1, depth: 1, height: 0.05 }, this.scene)
    }
}