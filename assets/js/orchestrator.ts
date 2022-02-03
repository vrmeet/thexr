import * as BABYLON from 'babylonjs'
import * as MAT from 'babylonjs-materials'
import { Socket, Channel } from 'phoenix'
import { Subject } from 'rxjs'
import { filter, throttleTime, skip } from 'rxjs/operators'
import { WebRTCClientAgora } from './web-rtc-client-agora';
import App from "./App.svelte";

import type { SceneSettings, SignalEvent } from './types'

const camPosRot = 'camPosRot'

// type SceneSettings = {
//     use_skybox: boolean
//     skybox_inclination: number
//     clear_color: string
//     fog_color: string
//     fog_density: number
// }

// type SignalEvent = {
//     event: string
//     payload: any
// }

export class Orchestrator {
    public canvas;
    public scene: BABYLON.Scene;
    public engine;
    public socket: Socket;
    public spaceChannel: Channel
    public slug: string
    public entities: any[]
    public settings: SceneSettings
    public signals: Subject<SignalEvent>
    public skyBox: BABYLON.Mesh
    public webRTCClient: WebRTCClientAgora


    constructor(public canvasId: string, public memberId: string, public serializedSpace: { settings: SceneSettings, slug: string, entities: any[] }) {

        this.signals = new Subject()
        this.socket = new Socket('/socket', { params: { token: window['userToken'] } })
        this.slug = serializedSpace.slug;
        this.entities = serializedSpace.entities
        this.settings = serializedSpace.settings
        this.webRTCClient = new WebRTCClientAgora(this.slug, this.memberId)

        // memberID: string,
        // mediaType: "audio" | "video",
        // playable: IPlayable,
        // mediaStreamTrack: MediaStreamTrack) => void

        this.webRTCClient.addRemoteStreamPublishedCallback((memberId, mediaType, playable, mediaStreamTrack) => {
            console.log('this user is now publishing audio', memberId);
            playable.play()
        })

        this.spaceChannel = this.socket.channel(`space:${serializedSpace.slug}`, { pos_rot: this.findMyPos() })


        window['channel'] = this.spaceChannel

        this.spaceChannel.on("server_lost", () => {
            window.location.href = '/';
        })

        this.spaceChannel.on("member_moved", ({ member_id, pos, rot }) => {
            let mesh = this.scene.getMeshByName(`avatar_${member_id}`)

            if (mesh) {
                mesh.position.fromArray(pos)
                if (!mesh.rotationQuaternion) {
                    mesh.rotationQuaternion = BABYLON.Quaternion.FromArray(rot)
                } else {
                    mesh.rotationQuaternion.copyFromFloats(rot[0], rot[1], rot[2], rot[3])
                }
            }

        })
        this.spaceChannel.on('component_changed', params => {
            let meshes = this.scene.getMeshesById(params.entity_id)
            meshes.forEach(mesh => {
                this.processComponent(mesh, { type: params.type, data: params.data })
            })
        })
        this.spaceChannel.on('entity_created', entity => {
            this.findOrCreateMesh(entity)
        })
        this.spaceChannel.on('entity_deleted', params => {
            let meshes = this.scene.getMeshesById(params.id)
            meshes.forEach(mesh => {
                mesh.dispose()
            })
        })

        this.spaceChannel.on('presence_state', params => {
            Object.keys(params).filter((id) => id !== this.memberId).map(id => {
                BABYLON.MeshBuilder.CreateBox(`avatar_${id}`)
            })
        })

        this.spaceChannel.on('presence_diff', params => {

            Object.keys(params.joins).filter((id) => id !== this.memberId).map(id => {
                BABYLON.MeshBuilder.CreateBox(`avatar_${id}`)
            })
        })

        this.spaceChannel.on('space_settings_changed', params => {
            this.processSceneSettings(params as SceneSettings)

        })

        window['orchestrator'] = this

        new App({ target: document.body, props: { canvasId: canvasId, webRTCClient: this.webRTCClient, signals: this.signals } });

    }

    joinSpace(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.socket.connect()
            this.spaceChannel.join()
                .receive('ok', resp => {
                    this.webRTCClient.join(resp.agora_app_id)
                    window['webRTCClient'] = this.webRTCClient;
                    console.log('Joined successfully')
                    resolve(resp)
                })
                .receive('error', resp => {
                    console.log('Unable to join', resp)
                    reject(resp)
                })

        })

    }

    findMyPos() {
        let camPosRotString = window.sessionStorage.getItem(camPosRot)
        if (!camPosRotString) {
            let spawnPoint = this.findSpawnPoint()
            window.sessionStorage.setItem(camPosRot, JSON.stringify(spawnPoint))
            return spawnPoint
        } else {
            return JSON.parse(camPosRotString)
        }
    }

    findSpawnPoint() {
        const result = this.entities.filter(entity => entity.type === 'spawn_point')
        console.log('result', JSON.stringify(result))
        if (result.length > 0) {
            let pos = result[0].components[0].data
            return { pos: [pos.x, pos.y, pos.z], rot: [0, 0, 0, 1] }
        } else {
            return { pos: [0, 1.7, -8], rot: [0, 0, 0, 1] }
        }

    }

    reduceSigFigs(value) {
        return Math.round(value * 100000) / 100000
    }

    async createCamera() {
        let pos = this.findMyPos()['pos']
        var camera = new BABYLON.FreeCamera('camera1', BABYLON.Vector3.FromArray(pos), this.scene);
        // Attach the camera to the canvas
        camera.attachControl(this.canvas, true);
        camera.inertia = 0.7;
        camera.onViewMatrixChangedObservable.add(cam => {
            let posArray = cam.position.asArray().map(this.reduceSigFigs)
            let rotArray = cam.absoluteRotation.asArray().map(this.reduceSigFigs)
            this.signals.next({ event: "camera_moved", payload: { pos: posArray, rot: rotArray } })
        })

        //  const env = this.scene.createDefaultEnvironment();

        const xr = await this.scene.createDefaultXRExperienceAsync({
            //floorMeshes: [env.ground]
        });

    }
    findOrCreateSkyBox() {
        if (!this.skyBox) {
            this.skyBox = BABYLON.MeshBuilder.CreateBox(`${this.slug}_skybox`, { size: 50 })
            this.skyBox.infiniteDistance = true
            let skyboxMaterial = new MAT.SkyMaterial("skyMaterial", this.scene);
            skyboxMaterial.backFaceCulling = false;
            this.skyBox.material = skyboxMaterial
        }
        return this.skyBox
    }
    processSkybox(useSkybox: boolean, inclination: number) {
        if (useSkybox) {
            this.findOrCreateSkyBox()
            let skyboxMaterial = this.skyBox.material as MAT.SkyMaterial
            skyboxMaterial.inclination = inclination
        } else {
            if (this.skyBox) {
                this.skyBox.material.dispose()
                this.skyBox.dispose()
                this.skyBox = null
            }
        }
    }

    processSceneSettings(settings: SceneSettings) {
        this.scene.clearColor = BABYLON.Color4.FromHexString(settings.clear_color)
        this.processSkybox(settings.use_skybox, settings.skybox_inclination)
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogColor = BABYLON.Color3.FromHexString(settings.fog_color)
        this.scene.fogDensity = settings.fog_density
    }

    async createScene() {
        // Create a basic BJS Scene object
        this.scene = new BABYLON.Scene(this.engine);
        this.processSceneSettings(this.settings as SceneSettings)
        window['scene'] = this.scene
        this.createCamera()

        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this.scene);
        this.parseInitialScene(this.entities)
        return this.scene;


    }

    parseInitialScene(entities) {
        entities.map(entity => {
            this.findOrCreateMesh(entity)
        })
    }

    findOrCreateMaterial(opts: { type: 'color' | 'grid', colorString?: string }) {
        if (opts.type === 'color' && opts.colorString) {
            let mat = this.scene.getMaterialByName(`mat_${opts.colorString}`)
            if (mat) {
                return mat
            } else {
                let myMaterial = new BABYLON.StandardMaterial(`mat_${opts.colorString}`, this.scene);
                let color = BABYLON.Color3.FromHexString(opts.colorString)
                myMaterial.diffuseColor = color;
                return myMaterial
            }
        } else {
            return this.scene.getMaterialByName('mat_grid') || (new MAT.GridMaterial('mat_grid', this.scene))
        }
    }


    findOrCreateMesh(entity: { type: string, name: string, id: string, components: any, parent?: string }) {

        let mesh: BABYLON.AbstractMesh
        mesh = this.scene.getMeshById(entity.id)
        if (!mesh) {
            if (entity.type === 'box') {
                mesh = BABYLON.MeshBuilder.CreateBox(entity.name, {}, this.scene)
            } else if (entity.type === 'plane') {
                mesh = BABYLON.MeshBuilder.CreatePlane(entity.name, { sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
            } else if (entity.type === 'grid') {
                mesh = BABYLON.MeshBuilder.CreatePlane(entity.name, { size: 25, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
                const gridMat = this.findOrCreateMaterial({ type: 'grid' })
                mesh.material = gridMat;
            } else if (entity.type === 'sphere') {
                mesh = BABYLON.MeshBuilder.CreateSphere(entity.name, {}, this.scene)
            } else if (entity.type === 'cone') {
                mesh = BABYLON.MeshBuilder.CreateCylinder(entity.name, { diameterTop: 0 }, this.scene)
            }
            if (mesh) {
                mesh.id = entity.id
            }
        }
        if (mesh) {
            entity.components.forEach(component => {
                this.processComponent(mesh, component)
            })
        }
        return mesh
    }

    processComponent(mesh: BABYLON.AbstractMesh, component: { type: string, data: any }) {
        switch (component.type) {
            case 'position':
                mesh.position.set(component.data.x, component.data.y, component.data.z)
                break;
            case 'scale':
                mesh.scaling.set(component.data.x, component.data.y, component.data.z)
                break;
            case 'rotation':
                mesh.rotation.set(component.data.x, component.data.y, component.data.z)
                break;
            case 'color':
                const mat = this.findOrCreateMaterial({ type: 'color', colorString: component.data.value })
                mesh.material = mat;
                break;
            default:
                console.log('unknown component', component.type)

        }
    }

    forwardCameraMovement() {
        // forward camera movement
        this.signals.pipe(
            filter(msg => (msg.event === 'camera_moved')),
            throttleTime(100)
        ).subscribe(msg => {
            this.spaceChannel.push(msg.event, msg.payload)
            window.sessionStorage.setItem(camPosRot, JSON.stringify(msg.payload))
        })
    }


    async start() {

        this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;

        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });

        this.createScene()
        // parse the scene for states
        // run the render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        // the canvas/window resize event handler
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        // listen for clicked join button
        this.signals.pipe(
            filter(msg => (msg.event == 'joined'))
        ).subscribe(async () => {
            await this.joinSpace();
            this.forwardCameraMovement()
        })



    }
}
window.addEventListener('DOMContentLoaded', async () => {
    const serializedSpace = window['serializedSpace']
    const memberId = window['memberId']
    const orchestrator = new Orchestrator('spaceCanvas', memberId, serializedSpace)
    orchestrator.start()


})


