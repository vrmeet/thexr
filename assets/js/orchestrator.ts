import * as BABYLON from 'babylonjs'
import * as MAT from 'babylonjs-materials'
import { float } from 'babylonjs/types';
import { Socket, Channel } from 'phoenix'
import { Subject } from 'rxjs'
import { filter, throttleTime } from 'rxjs/operators'

type SceneSettings = {
    clear_color: string
    fog_color: string
    fog_density: float
}

type SignalEvent = {
    event: string
    payload: any
}

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



    constructor(public canvasId: string, public memberId: string, public serializedSpace: { settings: SceneSettings, slug: string, entities: any[] }) {
        this.signals = new Subject()
        this.socket = new Socket('/socket', { params: { token: window['userToken'] } })
        this.slug = serializedSpace.slug;
        this.entities = serializedSpace.entities
        this.settings = serializedSpace.settings

        this.spaceChannel = this.socket.channel(`space:${serializedSpace.slug}`, { spawn_point: this.findMyPos() })

        this.socket.connect()
        this.spaceChannel.join()
            .receive('ok', resp => { console.log('Joined successfully', resp) })
            .receive('error', resp => { console.log('Unable to join', resp) })

        window['channel'] = this.spaceChannel
        this.spaceChannel.on("member_moved", ({ member_id, pos }) => {
            console.log("getting member moved", member_id, pos)
            let mesh = this.scene.getMeshByName(`avatar_${member_id}`)

            if (mesh) {
                mesh.position.fromArray(pos)
            }

        })
        this.spaceChannel.on('component_changed', params => {
            let meshes = this.scene.getMeshesById(params.entity_id)
            meshes.forEach(mesh => {
                this.processComponent(mesh, { type: params.type, data: params.data })
            })
            console.log('component changed', JSON.stringify(params, null, 2))
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
            console.log('presence_state', params)
            Object.keys(params).filter((id) => id !== this.memberId).map(id => {
                BABYLON.MeshBuilder.CreateBox(`avatar_${id}`)
            })
        })

        this.spaceChannel.on('presence_diff', params => {
            console.log('presence_diff', params)

            Object.keys(params.joins).filter((id) => id !== this.memberId).map(id => {
                BABYLON.MeshBuilder.CreateBox(`avatar_${id}`)
            })
        })

        this.spaceChannel.on('space_settings_changed', params => {
            this.processSceneSettings(params.clear_color, params.fog_color, params.fog_density)

        })

        window['orchestrator'] = this
    }

    findMyPos() {
        let posString = window.sessionStorage.getItem('pos')
        if (!posString) {
            let spawnPoint = this.findSpawnPoint()
            window.sessionStorage.setItem('pos', JSON.stringify(spawnPoint))
            return spawnPoint
        } else {
            return JSON.parse(posString)
        }
    }

    findSpawnPoint() {
        try {
            console.log('this entities', this.entities)
            // TODO: looking into using js match toy instead of try catch??
            const result = this.entities.filter(entity => entity.type === 'spawn_point')
            console.log('result', result)
            let pos = result[0].components[0].data

            return { pos: [pos.x, pos.y, pos.z] }
        } catch (e) {
            console.log(e)
            return { pos: [0, 0, 0] }
        }
    }

    async createCamera() {
        let pos = this.findMyPos()['pos']
        var camera = new BABYLON.FreeCamera('camera1', BABYLON.Vector3.FromArray(pos), this.scene);
        // Target the camera to scene origin
        // camera.setTarget(BABYLON.Vector3.Zero());
        // Attach the camera to the canvas
        camera.attachControl(this.canvas, true);
        camera.inertia = 0.7;
        camera.onViewMatrixChangedObservable.add(cam => {
            let posArray = cam.position.asArray().map(value => Math.round(value * 100000) / 100000)
            this.signals.next({ event: "camera_moved", payload: { pos: posArray } })
        })

        //  const env = this.scene.createDefaultEnvironment();

        const xr = await this.scene.createDefaultXRExperienceAsync({
            //floorMeshes: [env.ground]
        });

    }

    processSceneSettings(clearColor: string, fogColor: string, fogDensity: number) {
        this.scene.clearColor = BABYLON.Color4.FromHexString(clearColor)
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        this.scene.fogColor = BABYLON.Color3.FromHexString(fogColor)
        this.scene.fogDensity = fogDensity
    }

    async createScene() {
        // Create a basic BJS Scene object
        this.scene = new BABYLON.Scene(this.engine);
        this.processSceneSettings(this.settings.clear_color, this.settings.fog_color, this.settings.fog_density)
        window['scene'] = this.scene
        this.createCamera()

        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this.scene);
        this.parseInitialScene(this.entities)
        return this.scene;


    }

    parseInitialScene(entities) {
        entities.map(entity => {
            console.log(entity)
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
        console.log('attempting to process component', JSON.stringify(component))
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

        // send camera movement
        this.signals.pipe(
            filter(msg => (msg.event === 'camera_moved')),
            throttleTime(100)
        ).subscribe(msg => {
            this.spaceChannel.push(msg.event, msg.payload)
            window.sessionStorage.setItem('pos', JSON.stringify(msg.payload))
            console.log('saving pos', msg.payload)
        })

    }
}
window.addEventListener('DOMContentLoaded', async () => {
    const serializedSpace = window['serializedSpace']
    const memberId = window['memberId']
    const orchestrator = new Orchestrator('spaceCanvas', memberId, serializedSpace)
    orchestrator.start()
})
