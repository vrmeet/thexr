import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import type { Component } from "../../types";

export class PlaneEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("plane", scene)

    }

    defaultComponentAsObject(): Record<string, any> {
        return {
            position: this.cameraFrontPosition(),
            editable: true,

        }
    }


    createMesh() {
        return BABYLON.MeshBuilder.CreatePlane(this.name, { sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)

    }
}