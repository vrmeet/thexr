import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import { findOrCreateMaterial } from "../../utils";
import type { Component } from "../../types";

export class GridEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("grid", scene)

    }

    defaultMaterial() {
        return "grid"
    }

    defaultPosition(): number[] {
        return [0, -0.01, 0]
    }

    defaultRotation() {
        return [1.5708, 0, 0]
    }

    defaultCanTeleportTo(): boolean {
        return true
    }

    additionalComponentsAsObj() {
        return { size: 25 }
    }

    createMesh() {
        return BABYLON.MeshBuilder.CreatePlane(this.name, { ...this.argifyComponents(this.components, ["size"]), sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
    }
}