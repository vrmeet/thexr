import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import type { Component } from "../../types";

export class CapsuleEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("capsule", scene)

    }

    defaultComponentAsObject(): Record<string, any> {
        return {
            position: this.cameraFrontPosition(),
            editable: true,
            targetable: true,
            interactable: true,
            physics: true

        }
    }


    createMesh() {
        return BABYLON.MeshBuilder.CreateCapsule(this.name, {}, this.scene)
    }
}