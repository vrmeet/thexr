import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"


export class AmmoBoxEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {
        super("ammo_box", scene)
    }

    defaultComponentAsObject() {
        return {
            position: this.cameraFrontPosition(),
            bullets: 25,
            interactable: true,
            collectable: true,
            color: "#0000FF",
            editable: true
        }
    }


    createMesh() {
        return BABYLON.MeshBuilder.CreateBox(this.name, { width: 0.5, depth: 0.3, height: 0.5 }, this.scene)
    }
}