import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import type { Component } from "../../types";

export class CylinderEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("cylinder", scene)

    }

    defaultComponentAsObject(): Record<string, any> {
        return {
            position: this.cameraFrontPosition(),
            editable: true,
            teleportable: true,
            targetable: true
        }
    }


    createMesh() {
        return BABYLON.MeshBuilder.CreateCylinder(this.name, {}, this.scene)
    }
}