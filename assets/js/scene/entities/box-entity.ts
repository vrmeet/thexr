import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import type { Component } from "../../types";

export class BoxEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("box", scene)

    }

    // defaultComponents(): Component[] {
    //     let compObj = this.defaultComponentAsObject()
    //     compObj["collide"] = true
    //     compObj["editable"] = true
    //     compObj["targetable"] = true
    //     compObj["floor"] = true
    //     compObj["interactable"] = true
    //     return this.componentObjectToList(compObj)
    // }

    createMesh() {
        return BABYLON.MeshBuilder.CreateBox(this.name, this.argifyComponents(this.components, ["depth", "length", "width"]), this.scene)
    }
}