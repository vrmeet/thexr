import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import type { Component } from "../../types";

export class SphereEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("sphere", scene)

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
        return BABYLON.MeshBuilder.CreateSphere(this.name, {}, this.scene)
    }
}