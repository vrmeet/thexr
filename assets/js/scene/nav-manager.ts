import * as BABYLON from "babylonjs"
import { filter } from "rxjs/operators"
import { EventName } from "../event-names"
import type { SceneManager } from "../sceneManager"
import { signalHub } from "../signalHub"
import { AgentManager } from "./agent-manager"

const NAV_MESH_PARAMS = {
    cs: 0.2,
    ch: 0.2,
    walkableSlopeAngle: 35,
    walkableHeight: 1.0,
    walkableClimb: 1,
    walkableRadius: 1,
    maxEdgeLen: 12,
    maxSimplificationError: 1.3,
    minRegionArea: 8,
    mergeRegionArea: 20,
    maxVertsPerPoly: 6,
    detailSampleDist: 6,
    detailSampleMaxError: 1,
}

const MAX_AGENTS = 25
const MAX_AGENT_RADIUS = 1

export class NavManager {
    public navigationPlugin: BABYLON.RecastJSPlugin
    public csrfToken: string
    public navMeshCreated: boolean
    public debugMesh: BABYLON.Mesh
    public crowd: BABYLON.ICrowd
    public agentManager: AgentManager

    constructor(public member_id: string, public space_id: string, public scene: BABYLON.Scene) {
        this.navMeshCreated = false
        this.navigationPlugin = new BABYLON.RecastJSPlugin();

        this.csrfToken = document.getElementsByName("csrf-token")[0]['content'];
        signalHub.outgoing.on("event").pipe(
            filter(msg => EventName.entity_created === msg.m || EventName.entity_transformed === msg.m || EventName.entity_deleted === msg.m)
        ).subscribe(() => {
            this.uncacheNavMesh()
        })

        //  signalHub.local.on("client_ready").subscribe(() => {
        setTimeout(() => {
            // nav plugin takes some time to create
            if (this.navMeshCreated) {
                this.crowd = this.navigationPlugin.createCrowd(MAX_AGENTS, MAX_AGENT_RADIUS, this.scene)
                this.agentManager = new AgentManager(this.member_id, this.navigationPlugin, this.crowd, this.scene)
            }
        }, 500)

        // })
    }

    async loadOrMakeNavMesh(meshes: BABYLON.Mesh[]) {
        const binary = await this.fetchCachedBinaryData()
        if (binary === null) {
            await this.createNavMesh(meshes)
            await this.bakeNavMesh()
        } else {
            this.loadBinaryToPlugin(binary)
        }
        this.createDebugMesh()
    }

    loadBinaryToPlugin(binary: Uint8Array) {
        this.navigationPlugin.buildFromNavmeshData(binary)
        this.navMeshCreated = true
    }

    async fetchCachedBinaryData() {
        const response = await fetch(`/s/${this.space_id}/nav_mesh`, {
            method: "GET",
            headers: {
                "Accept": "*/*"
            }
        })
        if (response.status === 200) {
            const blob = await response.blob()
            const buffer = await blob.arrayBuffer()
            return new Uint8Array(buffer)
        } else {
            return null
        }
    }


    async uncacheNavMesh() {
        const response = await fetch(`/s/${this.space_id}/nav_mesh`, { // Your POST endpoint
            method: 'DELETE',
            headers: {
                'Accept': 'application/json, text/plain, text/html, *.*',
                "x-csrf-token": this.csrfToken
            }
        })

    }

    async createNavMesh(meshes: BABYLON.Mesh[]) {
        if (meshes.length < 1) {
            return
        }
        this.navigationPlugin.createNavMesh(meshes, NAV_MESH_PARAMS)
        this.navMeshCreated = true
    }


    async bakeNavMesh() {
        if (!this.navMeshCreated) {
            return
        }
        let data = this.navigationPlugin.getNavmeshData()
        const blob = new Blob([data.buffer], { type: "application/octet-stream" })
        const response = await fetch(`/s/${this.space_id}/nav_mesh`, { // Your POST endpoint
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, text/html, *.*',
                'Content-Type': 'multipart/form-data',
                "x-csrf-token": this.csrfToken
            },
            body: blob // This is your file object
        })
    }

    createDebugMesh() {
        if (!this.navMeshCreated) {
            return
        }
        let debugMesh = this.navigationPlugin.createDebugNavMesh(this.scene);
        debugMesh.showBoundingBox = true;
        debugMesh.isPickable = false;
        // debugMesh.position = new BABYLON.Vector3(0, 0.01, 0);
        var matdebug = new BABYLON.StandardMaterial("matdebug", this.scene);
        matdebug.diffuseColor = new BABYLON.Color3(1, 0, 0);
        matdebug.alpha = 0.5;
        debugMesh.material = matdebug;
    }

}