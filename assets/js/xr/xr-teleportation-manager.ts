import * as BABYLON from 'babylonjs'
import { signalHub } from '../signalHub'


export class TeleportationManager {
    public teleportation: BABYLON.WebXRMotionControllerTeleportation
    public floorMeshes: BABYLON.AbstractMesh[]

    constructor(public xrHelper: BABYLON.WebXRDefaultExperience, public scene: BABYLON.Scene) {
        this.floorMeshes = scene.getMeshesByTags("teleportable")
        this.enableTeleporationFeature()
        this.floorMeshes.forEach(mesh => {
            this.teleportation.addFloorMesh(mesh)
        })


        signalHub.local.on('mesh_built').subscribe(({ name }) => {
            let mesh = scene.getMeshByName(name)
            if (!mesh) {
                return
            }
            if (BABYLON.Tags.MatchesQuery(mesh, "teleportable")) {
                this.teleportation.addFloorMesh(mesh)
            }
            if (BABYLON.Tags.MatchesQuery(mesh, "blocker")) {
                this.teleportation.addBlockerMesh(mesh)
            }
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
