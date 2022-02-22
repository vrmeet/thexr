import * as BABYLON from 'babylonjs'


export class TeleportationManager {
    public teleportation: BABYLON.WebXRMotionControllerTeleportation
    public floorMeshes: BABYLON.AbstractMesh[]

    constructor(public xrHelper: BABYLON.WebXRDefaultExperience, public scene: BABYLON.Scene) {
        this.floorMeshes = scene.getMeshesByTags("teleportable")
        this.enableTeleporationFeature()
        this.floorMeshes.forEach(mesh => {
            this.teleportation.addFloorMesh(mesh)
        })


    }

    addFloorByMeshName(mesh_name) {
        let mesh = this.scene.getMeshByName(mesh_name)
        BABYLON.Tags.AddTagsTo(mesh, "teleportable")
        if (mesh) {
            this.teleportation.addFloorMesh(mesh)
        }
    }

    removeFloorByMeshName(mesh_name) {
        let mesh = this.scene.getMeshByName(mesh_name)
        if (mesh) {
            BABYLON.Tags.RemoveTagsFrom(mesh, "teleportable")
            this.teleportation.removeFloorMesh(mesh)
        }
    }


    enableTeleporationFeature() {
        this.teleportation = this.xrHelper.baseExperience.featuresManager.enableFeature(BABYLON.WebXRFeatureName.TELEPORTATION, 'latest' /* or latest */, {
            xrInput: this.xrHelper.input,
            floorMeshes: [],
            defaultTargetMeshOptions: {
                teleportationFillColor: 'yellow',
                teleportationBorderColor: 'green',
                timeToTeleport: 0,
                disableAnimation: true,
                disableLighting: true
            },
            forceHandedness: "right"
        }) as BABYLON.WebXRMotionControllerTeleportation
        this.teleportation.rotationEnabled = false
    }




}
