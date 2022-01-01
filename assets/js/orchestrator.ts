import * as BABYLON from 'babylonjs'
import * as MAT from 'babylonjs-materials'

export class Orchestrator {
    public canvas;
    public scene;
    public engine;
    constructor(public canvasId: string) {

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
        this.parseInitialScene(window['initialScene'])
        return this.scene;


    }

    parseInitialScene(entities) {
        entities.map(entity => {
            console.log(entity)
            this.findOrCreateMesh(entity)
        })
    }


    findOrCreateMesh(entity: { type: string, name: string, id: string, components: any, parent?: string }) {

        let mesh: BABYLON.AbstractMesh
        mesh = this.scene.getMeshById(entity.id)
        if (!mesh) {
            if (entity.type === 'box') {
                mesh = BABYLON.MeshBuilder.CreateBox(entity.name, {}, this.scene)
            } else if (entity.type === 'plane') {
                mesh = BABYLON.MeshBuilder.CreatePlane(entity.name, {}, this.scene)
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

window['orchestrator'] = new Orchestrator('spaceCanvas')