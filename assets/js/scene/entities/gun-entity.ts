import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import type { Component } from "../../types";

export class GunEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("gun", scene)

    }

    defaultComponentAsObject(): Record<string, any> {
        return {
            position: this.cameraFrontPosition(),
            color: "#A0A0A0",
            editable: true,
            shootable: true,
            interactable: true
        }
    }


    createMesh() {

        let barrel = BABYLON.MeshBuilder.CreateBox(this.name, { width: 0.05, depth: 0.25, height: 0.05 }, this.scene)
        barrel.position.z = 0.07
        barrel.position.y = 0.05
        let handle = BABYLON.MeshBuilder.CreateBox(this.name, { width: 0.05, depth: 0.07, height: 0.15 }, this.scene)
        handle.rotation.x = BABYLON.Angle.FromDegrees(45).radians()
        return BABYLON.Mesh.MergeMeshes([barrel, handle], true);


    }
}