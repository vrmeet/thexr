import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import type { Component } from "../../types";

export class BoxEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("box", scene)

    }

    defaultComponentAsObject(): Record<string, any> {
        return {
            position: this.cameraFrontPosition(),
            editable: true,
            teleportable: true
        }
    }


    createMesh() {
        return BABYLON.MeshBuilder.CreateBox(this.name, this.argifyComponents(this.components, ["depth", "length", "width"]), this.scene)
    }
}