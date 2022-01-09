import * as BABYLON from 'babylonjs'
import * as MAT from 'babylonjs-materials'
import { Socket, Channel } from 'phoenix'

export class Orchestrator {
    public canvas;
    public scene: BABYLON.Scene;
    public engine;
    public socket: Socket;
    public spaceChannel: Channel
    public slug: string
    public entities: any[]
    constructor(public canvasId: string, public serializedSpace: { slug: string, entities: any[] }) {
        this.socket = new Socket('/socket', { params: {} })
        this.slug = serializedSpace.slug;
        this.entities = serializedSpace.entities
        this.spaceChannel = this.socket.channel(`space:${serializedSpace.slug}`, {})

        this.socket.connect()
        this.spaceChannel.join()
            .receive("ok", resp => { console.log("Joined successfully", resp) })
            .receive("error", resp => { console.log("Unable to join", resp) })

        window['channel'] = this.spaceChannel
        this.spaceChannel.on("component_changed", params => {
            let meshes = this.scene.getMeshesById(params.entity_id)
            meshes.forEach(mesh => {
                this.processComponent(mesh, { type: params.type, data: params.data })
            })
            console.log("component changed", JSON.stringify(params, null, 2))
        })
        this.spaceChannel.on("entity_created", entity => {
            this.findOrCreateMesh(entity)
        })
        this.spaceChannel.on("entity_deleted", params => {
            let meshes = this.scene.getMeshesById(params.id)
            meshes.forEach(mesh => {
                mesh.dispose()
            })
        })

    }

    createScene() {
        // Create a basic BJS Scene object
        this.scene = new BABYLON.Scene(this.engine);
        window['scene'] = this.scene
        // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
        var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), this.scene);
        // Target the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());
        // Attach the camera to the canvas
        camera.attachControl(this.canvas, false);
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
            return this.scene.getMaterialByName("mat_grid") || (new MAT.GridMaterial("mat_grid", this.scene))
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
                const gridMat = this.findOrCreateMaterial({ type: "grid" })
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
                const mat = this.findOrCreateMaterial({ type: "color", colorString: component.data.value })
                mesh.material = mat
            default:
                console.log('unknown component', component.type)

        }
    }


    start() {
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

    }
}
window.addEventListener('DOMContentLoaded', async () => {
    let serializedSpace = window['serializedSpace']
    let orchestrator = new Orchestrator('spaceCanvas', serializedSpace)
    orchestrator.start()
})
