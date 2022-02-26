import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import * as MAT from 'babylonjs-materials'
import type { Channel } from 'phoenix';
import type { SignalHub, SceneSettings, SerializedSpace } from './types'
import { sessionPersistance } from './sessionPersistance';
import { MenuManager } from './menu/menu-manager'
import { reduceSigFigs } from './utils';
import { XRManager } from './xr-manager';
import type { Orchestrator } from './orchestrator';
import { signalHub } from './signalHub';

export class SceneManager {
    public canvas: HTMLCanvasElement;
    public scene: BABYLON.Scene;
    public engine: BABYLON.Engine;
    public entities: any[]
    public skyBox: BABYLON.Mesh
    public settings: SceneSettings
    public slug: string;
    public spaceChannel: Channel
    public menuManager: MenuManager
    public freeCamera: BABYLON.FreeCamera
    public xrManager: XRManager
    public canvasId: string
    public memberId: string
    public serializedSpace: SerializedSpace


    constructor(public orchestrator: Orchestrator) {
        this.canvasId = orchestrator.canvasId
        this.memberId = orchestrator.memberId
        this.serializedSpace = orchestrator.serializedSpace
        this.slug = this.serializedSpace.slug
        this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
        this.settings = this.serializedSpace.settings
        this.entities = this.serializedSpace.entities

    }

    setChannel(spaceChannel: Channel) {
        this.spaceChannel = spaceChannel
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
            Object.keys(params).filter((id) => id !== this.memberId).forEach(id => {
                this.findOrCreateAvatar(id, params[id].metas[0].pos_rot)
            })
        })

        this.spaceChannel.on('presence_diff', params => {
            Object.keys(params.joins).filter((id) => id !== this.memberId).forEach(id => {
                this.findOrCreateAvatar(id, params.joins[id].metas[0].pos_rot)
            })
            Object.keys(params.leaves).map(id => {
                this.removeAvatar(id)
            })
        })

        this.spaceChannel.on('space_settings_changed', params => {
            this.processSceneSettings(params as SceneSettings)

        })

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


    removeAvatar(id) {
        let box = this.scene.getMeshByName(`avatar_${id}`)
        if (box) {
            box.dispose()
        }
    }

    findOrCreateAvatar(id: string, posRot: any) {
        let box = this.scene.getMeshByName(`avatar_${id}`)
        if (!box) {
            box = BABYLON.MeshBuilder.CreateBox(`avatar_${id}`)
        }
        if (!posRot) {
            return box
        } else {
            box.position = BABYLON.Vector3.FromArray(posRot.pos)
            box.rotationQuaternion = BABYLON.Quaternion.FromArray(posRot.rot)
            return box
        }
    }


    findSpawnPoint() {
        const result = this.entities.filter(entity => entity.type === 'spawn_point')
        if (result.length > 0) {
            let pos = result[0].components[0].data
            return { pos: [pos.x, pos.y, pos.z], rot: [0, 0, 0, 1] }
        } else {
            return { pos: [0, 1.7, -8], rot: [0, 0, 0, 1] }
        }

    }



    getMyPosRot() {
        const camPosRot = sessionPersistance.getCameraPosRot()

        if (!camPosRot) {
            let spawnPoint = this.findSpawnPoint()
            sessionPersistance.saveCameraPosRot(spawnPoint)
            return spawnPoint
        } else {
            return camPosRot
        }
    }

    async createCamera() {
        let posRot = this.getMyPosRot()
        this.freeCamera = new BABYLON.FreeCamera('freeCam', BABYLON.Vector3.FromArray(posRot.pos), this.scene);
        this.freeCamera.rotationQuaternion = BABYLON.Quaternion.FromArray(posRot.rot)
        // Attach the camera to the canvas
        this.freeCamera.attachControl(this.canvas, true);
        this.freeCamera.inertia = 0.7;
        this.freeCamera.minZ = 0.05
        this.freeCamera.onViewMatrixChangedObservable.add(cam => {
            let posArray = cam.position.asArray().map(reduceSigFigs)
            let rotArray = cam.absoluteRotation.asArray().map(reduceSigFigs)
            signalHub.emit('camera_moved', { pos: posArray, rot: rotArray })
            //signalHub.next({ event: "camera_moved", payload: { pos: posArray, rot: rotArray } })
        })

        //  const env = this.scene.createDefaultEnvironment();

        this.xrManager = new XRManager(this.scene)
        await this.xrManager.enableWebXRExperience()
        this.menuManager = new MenuManager(this.orchestrator)

        // signalHub.next({ event: 'camera_ready', payload: {} })
        signalHub.emit('camera_ready', {})
        // this.tempMenu()




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
                BABYLON.Tags.AddTagsTo(mesh, "teleportable")
            } else if (entity.type === 'plane') {
                mesh = BABYLON.MeshBuilder.CreatePlane(entity.name, { sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
            } else if (entity.type === 'grid') {
                mesh = BABYLON.MeshBuilder.CreatePlane(entity.name, { size: 25, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
                const gridMat = this.findOrCreateMaterial({ type: 'grid' })
                mesh.material = gridMat;
                BABYLON.Tags.AddTagsTo(mesh, "teleportable")

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
                console.error('unknown component', component.type)

        }
    }

    run() {
        // run the render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        // the canvas/window resize event handler
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        // this.menuManager.test()
    }

}