import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import type { Component } from "../../types";

export class ConeEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("cone", scene)

    }

    defaultComponentAsObject(): Record<string, any> {
        return {
            position: this.cameraFrontPosition(),
            editable: true,
            interactable: true,
            targetable: true,
            physics: true

        }
    }


    createMesh() {

        return BABYLON.MeshBuilder.CreateCylinder(this.name, { diameterTop: 0 }, this.scene)
    }
}