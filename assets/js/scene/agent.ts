/*
can represent an enemy or npc
*/
import * as BABYLON from "babylonjs"
import type { Avatar } from "./avatar"

export class Agent {
    public coneOfSight: BABYLON.AbstractMesh
    public body: BABYLON.AbstractMesh
    public transform: BABYLON.TransformNode
    constructor(public id: string, public name: string, public position: number[], public scene: BABYLON.Scene) {
        this.createBody()
    }

    createBody() {
        let head = BABYLON.MeshBuilder.CreateCylinder(`head_${this.name}`, { diameterBottom: 0, diameterTop: 0.5, height: 0.8 }, this.scene)
        head.rotation.x = BABYLON.Angle.FromDegrees(90).radians()
        head.position.y = 1.5

        this.coneOfSight = BABYLON.MeshBuilder.CreateCylinder(`sight_${this.name}`, { diameterBottom: 0.2, diameterTop: 8, height: 15 }, this.scene)
        this.coneOfSight.rotation.x = BABYLON.Angle.FromDegrees(92).radians()
        this.coneOfSight.position.y = 1.3
        this.coneOfSight.scaling.x = 2
        this.coneOfSight.scaling.z = 0.5
        this.coneOfSight.position.z = 7
        this.coneOfSight.visibility = 0.5
        this.coneOfSight.isPickable = false

        let body = BABYLON.MeshBuilder.CreateBox(`body_${this.name}`, { width: 1, depth: 1, height: 2 }, this.scene)
        this.body = BABYLON.Mesh.MergeMeshes([head, body], true);
        BABYLON.Tags.AddTagsTo(this.body, "targetable")
        this.body.id = this.id
        this.body.name = this.name
        this.transform = new BABYLON.TransformNode(`transform_${this.name}`, this.scene);
        this.body.parent = this.transform
        this.coneOfSight.parent = this.body

    }

    canSeePosition(position: BABYLON.Vector3) {
        if (this.coneOfSight.intersectsPoint(position)) {
            return position
        }
        return null
    }

    // loops through all avatars and returns first one found that is within the cone of visiblity
    firstSeenAvatar(avatarMeshes: BABYLON.AbstractMesh[]): BABYLON.Vector3 | null {
        for (let i = 0; i < avatarMeshes.length; i++) {
            if (avatarMeshes[i].intersectsMesh(this.coneOfSight)) {
                return avatarMeshes[i].position
            }
        }
        return this.canSeePosition(this.scene.activeCamera.position)
    }

    dispose() {
        this.coneOfSight.dispose()
        this.body.dispose()
        this.transform.dispose()
    }



}