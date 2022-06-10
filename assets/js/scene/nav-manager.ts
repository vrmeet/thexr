import * as BABYLON from "babylonjs"
import { filter } from "rxjs/operators"
import { EventName } from "../event-names"
import type { SceneManager } from "../sceneManager"
import { signalHub } from "../signalHub"

const NAV_MESH_PARAMS = {
    cs: 0.2,
    ch: 0.2,
    walkableSlopeAngle: 90,
    walkableHeight: 1.0,
    walkableClimb: 1,
    walkableRadius: 1,
    maxEdgeLen: 12.,
    maxSimplificationError: 1.3,
    minRegionArea: 8,
    mergeRegionArea: 20,
    maxVertsPerPoly: 6,
    detailSampleDist: 6,
    detailSampleMaxError: 1,
}

export class NavManager {
    public navigationPlugin: BABYLON.RecastJSPlugin
    public scene: BABYLON.Scene
    public csrfToken: string
    public navMeshCreated: boolean
    public debugMesh: BABYLON.Mesh

    constructor(public sceneManager: SceneManager) {
        this.navMeshCreated = false
        this.scene = sceneManager.scene
        this.navigationPlugin = new BABYLON.RecastJSPlugin();
        this.csrfToken = document.getElementsByName("csrf-token")[0]['content'];
        signalHub.outgoing.on("event").pipe(
            filter(msg => EventName.entity_created === msg.m || EventName.entity_transformed === msg.m || EventName.entity_deleted === msg.m)
        ).subscribe(() => {
            console.log("scene changed, uncache nav mesh")
            this.sceneManager.navManager.uncacheNavMesh()
        })
    }

    async loadCacheOrCreateNavMesh(meshes: BABYLON.Mesh[]) {

        const didFindCache = await this.loadNavMesh()
        console.log("did find cache", didFindCache)
        if (!didFindCache) {
            await this.createNavMesh(meshes)
            await this.bakeNavMesh()
        }
        console.log('confirm navmesh data', this.navigationPlugin.getNavmeshData())

        this.createDebugMesh()
    }

    async loadNavMesh() {

        const response = await fetch(`/s/${this.sceneManager.space_id}/nav_mesh`, { // Your POST endpoint
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, text/html, *.*',
            }
        })

        if (response.status === 200) {
            const blob = await response.blob()
            console.log('fetched blob', blob)
            const buffer = await blob.arrayBuffer()
            const view = new Uint8Array(buffer)
            console.log('view', view)

            this.navigationPlugin.buildFromNavmeshData(view)
            return true
        } else {
            return false
        }
    }

    async uncacheNavMesh() {
        const response = await fetch(`/s/${this.sceneManager.space_id}/nav_mesh`, { // Your POST endpoint
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, text/html, *.*',
                'Content-Type': 'multipart/form-data',
                "x-csrf-token": this.csrfToken
            },
            body: null // This is your file object
        })

    }

    async createNavMesh(meshes: BABYLON.Mesh[]) {
        if (meshes.length < 1) {
            console.log('skip bake mesh, no meshes')
            return
        }
        this.navigationPlugin.createNavMesh(meshes, NAV_MESH_PARAMS)
        this.navMeshCreated = true

    }


    async bakeNavMesh() {

        //console.log("in create Nav Mesh")
        //  const recast = await window['recast']

        //console.log('awaited recast', recast)


        // if (!this.navigationPlugin) {
        //     return
        // }
        // try to create a nav mesh

        //    this.navigationPlugin.setWorkerURL("/assets/navMeshWorker.js");

        let data = this.navigationPlugin.getNavmeshData()
        console.log('getting data', data)
        const blob = new Blob([data.buffer], { type: "application/octet-stream" })
        console.log('making blob', blob)
        const response = await fetch(`/s/${this.sceneManager.space_id}/nav_mesh`, { // Your POST endpoint
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, text/html, *.*',
                'Content-Type': 'multipart/form-data',
                "x-csrf-token": this.csrfToken
            },
            body: blob // This is your file object
        })

        // this.createDebugMesh()

        console.log('save response', response)




        // , navMeshData => {

        //  this.navigationPlugin.buildFromNavmeshData(navMeshData)

        // })

    }

    createDebugMesh() {
        // if (!this.navMeshCreated) {
        //     return
        // }
        // if (this.debugMesh) {
        //     this.debugMesh.material.dispose()
        //     this.debugMesh.dispose()
        // }
        console.log("building debug mesh")
        let debugMesh = this.navigationPlugin.createDebugNavMesh(this.scene);
        debugMesh.showBoundingBox = true;
        debugMesh.position = new BABYLON.Vector3(0, 0.01, 0);
        var matdebug = new BABYLON.StandardMaterial("matdebug", this.scene);
        matdebug.diffuseColor = new BABYLON.Color3(1, 0, 0);
        matdebug.alpha = 0.5;
        debugMesh.material = matdebug;
    }

}