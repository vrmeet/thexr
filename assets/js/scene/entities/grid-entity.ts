import { EntityBase } from "../entity-base";
import * as BABYLON from "babylonjs"
import { findOrCreateMaterial } from "../../utils";
import type { Component } from "../../types";

export class GridEntity extends EntityBase {
    constructor(public scene: BABYLON.Scene) {

        super("grid", scene)

    }



    createMesh() {
        let mesh = BABYLON.MeshBuilder.CreatePlane(this.name, { size: 25, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
        // mesh.checkCollisions = true
        // mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.7 }, this.scene);

        const gridMat = findOrCreateMaterial({ type: "grid" }, this.scene)
        mesh.material = gridMat;

        // BABYLON.Tags.AddTagsTo(mesh, "teleportable")

        return mesh
        // return BABYLON.MeshBuilder.CreateBox(this.name, this.argifyComponents(this.components), this.scene)
    }
}