import * as BABYLON from "babylonjs"
import Ammo from 'ammojs-typed'

import * as MAT from "babylonjs-materials"
import type { Component, event, PosRot, scene_settings, serialized_space } from "./types"
import { sessionPersistance } from "./sessionPersistance";
import { MenuManager } from "./menu/menu-manager"
import { reduceSigFigs, unsetPosRot } from "./utils";
import { XRManager } from "./xr/xr-manager";

import { signalHub } from "./signalHub";
import { DamageOverlay } from "./damage-overlay";
import { isMobileVR } from "./utils";
import { HudMessager } from "./hud-message";
import { BulletManager } from "./scene/bullet-manager";

import { EventName } from "./event-names"
import { NavManager } from "./scene/nav-manager";
import { createWall } from "./scene/constructs";
import { filter, sample } from "rxjs/operators";

import { Avatar } from "./scene/avatar"
import { Inline } from "./scene/inline";
import { FreeCameraKeyboardMoveInput } from "babylonjs";
import { FreeCameraKeyboardWalkInput } from "./scene/camera-inputs/free-camera-keyboard-walk-input";
import { Observable, Subject } from "rxjs";
import { CollectManager } from "./scene/collect-manager";
import { AvatarManager } from "./scene/avatar-manager";

const ANIMATION_FRAME_PER_SECOND = 60
const TOTAL_ANIMATION_FRAMES = 5

export class SceneManager {
    public canvas: HTMLCanvasElement
    public scene: BABYLON.Scene;
    public engine: BABYLON.Engine;
    public entities: { id: string, type: string, name: string, parent: string, components: { type: string, data: { value: any } }[] }[]
    public skyBox: BABYLON.Mesh
    public settings: scene_settings
    public space_id: string;
    public menuManager: MenuManager
    public freeCamera: BABYLON.FreeCamera
    public xrManager: XRManager
    public canvasId: string
    public bulletManager: BulletManager
    public avatarManager: AvatarManager
    public isLeader: boolean
    public navManager: NavManager


    constructor(public member_id: string, public serializedSpace: serialized_space) {
        this.isLeader = false
        this.space_id = this.serializedSpace.id
        this.canvas = document.getElementById(this.space_id) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
        this.settings = this.serializedSpace.settings
        this.entities = this.serializedSpace.entities

        this.setChannelListeners()

        signalHub.local.on("client_ready").subscribe(async () => {

            await this.xrManager.enableWebXRExperience()

            if (isMobileVR()) {
                this.xrManager.enterXR()
            }

            // falling objects should not fall for ever
            // setInterval(() => {
            //     console.log("checking meshes for falling")
            //     const meshes = this.scene.getMeshesByTags("physics || targetable")
            //     console.log("meshes count", meshes.length)
            //     meshes.forEach(mesh => {
            //         console.log("mesh y", mesh.absolutePosition.y)
            //         if (mesh.absolutePosition.y < -10) {
            //             if (mesh.physicsImpostor) {
            //                 mesh.physicsImpostor.dispose()
            //                 mesh.physicsImpostor = null
            //             }
            //             mesh.position.copyFromFloats(Math.random() * 10 - 5, 1, Math.random() * 10 - 5)
            //         }
            //     })
            // }, 10000)


        })




        signalHub.incoming.on("event").pipe(
            filter(evt => evt.m === EventName.member_died && evt.p["member_id"] === this.member_id)
        ).subscribe(() => {

            setTimeout(() => {
                let spawnPosRot = this.findSpawnPoint()
                let cam = this.scene.activeCamera as BABYLON.FreeCamera
                cam.position.copyFromFloats(spawnPosRot.pos[0], spawnPosRot.pos[1], spawnPosRot.pos[2])
                cam.rotationQuaternion = BABYLON.Quaternion.FromArray(spawnPosRot.rot)

                signalHub.outgoing.emit("event", { m: EventName.member_respawned, p: { member_id: this.member_id, pos_rot: spawnPosRot } })
            }, 5000)

        })


        window['sceneManager'] = this
    }

    initLeaderDuties() {
        this.entities
            .filter(entity => entity.type === "enemy_spawner")
            .forEach(spawner => {

                this.navManager.agentManager.addAgentSpawnPoint(spawner.name)
            })
        if (this.navManager.navMeshCreated) {
            this.navManager.agentManager.startSpawning()
            this.navManager.agentManager.planMovementForAllAgents()
        }
    }

    setChannelListeners() {

        signalHub.incoming.on("new_leader").subscribe(({ member_id }) => {
            console.log('leader is', member_id)
            if (this.member_id === member_id) {
                this.isLeader = true
                console.log("i'm leader")
                this.initLeaderDuties() // should only run once
            } else {
                this.isLeader = false
                console.log("i'm not leader")
            }
        })








        signalHub.incoming.on("event").subscribe((mpts) => {

            if (mpts.m === EventName.entity_created) {
                this.findOrCreateMesh(mpts.p)
            } else if (mpts.m === EventName.entity_transformed) {
                let meshes = this.scene.getMeshesById(mpts.p.id)
                meshes.forEach(mesh => {
                    mpts.p.components.forEach(payload => {
                        this.animateComponent(mesh, payload)
                    })
                    // this.setComponent(mesh, { type: mpts.p.type, data: params.data })
                })
            } else if (mpts.m === EventName.entity_colored) {
                let meshes = this.scene.getMeshesById(mpts.p.id)
                meshes.forEach(mesh => {
                    this.setComponent(mesh, { type: "color", data: { value: mpts.p.color } })

                    // this.setComponent(mesh, { type: mpts.p.type, data: params.data })
                })
            } else if (mpts.m === EventName.entity_deleted) {
                let meshes = this.scene.getMeshesById(mpts.p.id)
                meshes.forEach(mesh => {
                    BABYLON.Animation.CreateAndStartAnimation("delete", mesh, "scaling", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, mesh.scaling.clone(), new BABYLON.Vector3(0.01, 0.01, 0.01), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
                        mesh.dispose()
                    });
                })
            }
        })


        signalHub.incoming.on("space_settings_changed").subscribe(params => {
            this.processscene_settings(params as scene_settings)

        })

    }
    async createScene() {
        // Create a basic BJS Scene object
        this.scene = new BABYLON.Scene(this.engine);

        this.scene.onPointerObservable.add(pointerInfo => {
            signalHub.local.emit("pointer_info", pointerInfo)
        })

        this.scene.onKeyboardObservable.add(keyboardInfo => {
            signalHub.local.emit("keyboard_info", keyboardInfo)
        })


        this.scene.metadata = { member_id: this.member_id }  // this is so often needed along with the scene, I can make this available inside the scene

        var gravityVector = new BABYLON.Vector3(0, -9.81, 0);
        const ammo = await Ammo()

        var physicsPlugin = new BABYLON.AmmoJSPlugin(true, ammo);
        this.scene.enablePhysics(gravityVector, physicsPlugin);

        this.processscene_settings(this.settings as scene_settings)
        window["scene"] = this.scene
        this.createCamera()


        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.navManager = new NavManager(this.member_id, this.space_id, this.scene)
        await this.parseInitialScene(this.entities)

        this.xrManager = new XRManager(this.member_id, this.scene)
        this.menuManager = new MenuManager(this.scene, this.xrManager)

        new DamageOverlay(this.member_id, this.scene)
        new HudMessager(this.scene)
        this.bulletManager = new BulletManager(this.member_id, this.scene)

        new CollectManager(this.member_id, this.scene)

        this.avatarManager = new AvatarManager(this.member_id, this.scene)

        return this.scene;

    }



    findSpawnPoint() {
        const result = this.entities.filter(entity => entity.type === "spawn_point")
        if (result.length > 0) {
            let pos = result[0].components.filter(c => c.type === "position")[0].data.value
            let rot = BABYLON.Vector3.FromArray(result[0].components.filter(c => c.type === "rotation")[0].data.value).toQuaternion().asArray()
            return { pos: pos, rot: rot }
        } else {
            return { pos: [0, 1.7, -8], rot: [0, 0, 0, 1] }
        }

    }



    getLastPosRot() {
        const camPosRot = sessionPersistance.getCameraPosRot()

        if (!camPosRot) {
            let spawnPoint = this.findSpawnPoint()
            sessionPersistance.saveCameraPosRot(spawnPoint)
            return spawnPoint
        } else {
            return camPosRot
        }
    }



    /*
     this.camera.attachControl(this.engine._workingCanvas, false)
        this.camera.angularSensibility = 250
        console.log("default camera angular sensibility", this.camera.angularSensibility)
     
        this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
        this.camera.inputs.add(new FreeCameraKeyboardWalkInput())
     
    */


    createCamera() {
        let posRot = this.getLastPosRot()
        this.freeCamera = new BABYLON.FreeCamera("freeCam", BABYLON.Vector3.FromArray(posRot.pos), this.scene);
        this.freeCamera.rotationQuaternion = BABYLON.Quaternion.FromArray(posRot.rot)

        // setup tools for 2D grabbing and avatar
        new Inline(this.member_id, this.scene, this.freeCamera)
        signalHub.local.emit("camera_ready", posRot)

        addEventListener("beforeunload", () => {
            let cam = this.scene.activeCamera
            let pos = cam.position.asArray().map(reduceSigFigs)
            let rot = cam.absoluteRotation.asArray().map(reduceSigFigs)
            sessionPersistance.saveCameraPosRot({ pos, rot })
        }, { capture: true });

        return this.freeCamera


    }




    findOrCreateSkyBox() {
        if (!this.skyBox) {
            this.skyBox = BABYLON.MeshBuilder.CreateBox(`${this.space_id}_skybox`, { size: 50 })
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

    processscene_settings(settings: scene_settings) {
        this.scene.clearColor = BABYLON.Color4.FromHexString(settings.clear_color)
        this.processSkybox(settings.use_skybox, settings.skybox_inclination)
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogColor = BABYLON.Color3.FromHexString(settings.fog_color)
        this.scene.fogDensity = settings.fog_density
    }


    parseEntity(entity): any {
        return this.findOrCreateMesh(entity)
    }

    async parseInitialScene(entities) {
        const meshes = entities.reduce((acc, entity) => {
            const result = this.parseEntity(entity)
            if (result && typeof result['getClassName'] === 'function' && result.getClassName() === 'Mesh') {
                acc.push(result)
            }
            return acc

        }, [])

        await this.navManager.loadOrMakeNavMesh(meshes)
    }


    findOrCreateMaterial(opts: { type: "color" | "grid", colorString?: string }) {
        if (opts.type === "color" && opts.colorString) {
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

    argifyComponents(components: { type: string, data: { value: any } }[]) {
        const blackList = ["scaling", "position", "rotation"]
        return components.reduce((acc, component) => {
            if (!blackList.includes(component.type)) {
                acc[component.type] = component.data.value
            }
            return acc
        }, {})
    }

    createBox(name, components) {

        return BABYLON.MeshBuilder.CreateBox(name, this.argifyComponents(components), this.scene)
    }

    findOrCreateMesh(entity: { type: string, name: string, id: string, components: Component[], parent?: string }): BABYLON.AbstractMesh {

        let mesh: BABYLON.AbstractMesh
        mesh = this.scene.getMeshById(entity.id)
        if (!mesh) {

            if (entity.type === "box") {
                // mesh = BABYLON.MeshBuilder.CreateBox(entity.name, {}, this.scene)
                mesh = this.createBox(entity.name, entity.components)
                BABYLON.Tags.AddTagsTo(mesh, "teleportable interactable targetable")
            } else if (entity.type === "spawn_point") {
                mesh = BABYLON.MeshBuilder.CreateBox(entity.name, { width: 1, depth: 1, height: 0.3 }, this.scene)
            } else if (entity.type === "wall") {
                const height: number = (entity.components.filter(comp => comp.type === "height")[0]?.data?.value || 2) as number
                const points: number[] = entity.components.filter(comp => comp.type === "points")[0].data.value as number[]
                mesh = createWall(entity.name, height, points, this.scene)

            } else if (entity.type === "cylinder") {
                mesh = BABYLON.MeshBuilder.CreateCylinder(entity.name, {}, this.scene)
                BABYLON.Tags.AddTagsTo(mesh, "teleportable interactable targetable")
                // mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 1, friction: 0.2, restitution: 0.7 }, this.scene);

            } else if (entity.type === "gun") {
                let barrel = BABYLON.MeshBuilder.CreateBox(entity.name, { width: 0.05, depth: 0.25, height: 0.05 }, this.scene)
                barrel.position.z = 0.07
                barrel.position.y = 0.05
                let handle = BABYLON.MeshBuilder.CreateBox(entity.name, { width: 0.05, depth: 0.07, height: 0.15 }, this.scene)
                handle.rotation.x = BABYLON.Angle.FromDegrees(45).radians()
                mesh = BABYLON.Mesh.MergeMeshes([barrel, handle], true);
                entity.components.push({ type: "color", data: { value: "#A0A0A0" } })
                // mesh = BABYLON.MeshBuilder.CreateTorus("gun", {}, this.scene)
                BABYLON.Tags.AddTagsTo(mesh, "interactable shootable")
            } else if (entity.type === "ammo_box") {
                mesh = BABYLON.MeshBuilder.CreateBox(entity.name, { width: 0.5, depth: 0.3, height: 0.5 }, this.scene)
                entity.components.push({ type: "color", data: { value: "#909090" } })
                BABYLON.Tags.AddTagsTo(mesh, "collectable")
            } else if (entity.type === "capsule") {
                mesh = BABYLON.MeshBuilder.CreateCapsule(entity.name, {}, this.scene)
                BABYLON.Tags.AddTagsTo(mesh, "interactable targetable physics")
            } else if (entity.type === "plane") {
                mesh = BABYLON.MeshBuilder.CreatePlane(entity.name, { sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
            } else if (entity.type === "grid") {
                mesh = BABYLON.MeshBuilder.CreatePlane(entity.name, { size: 25, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)

                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.7 }, this.scene);

                const gridMat = this.findOrCreateMaterial({ type: "grid" })
                mesh.material = gridMat;
                BABYLON.Tags.AddTagsTo(mesh, "teleportable")

            } else if (entity.type === "sphere") {
                mesh = BABYLON.MeshBuilder.CreateSphere(entity.name, {}, this.scene)
                BABYLON.Tags.AddTagsTo(mesh, "interactable targetable physics")
            } else if (entity.type === "cone") {
                mesh = BABYLON.MeshBuilder.CreateCylinder(entity.name, { diameterTop: 0 }, this.scene)
                BABYLON.Tags.AddTagsTo(mesh, "interactable targetable physics")
            } else if (entity.type === "enemy_spawner") {
                mesh = BABYLON.MeshBuilder.CreateBox(entity.name, { width: 1, depth: 1, height: 0.1 }, this.scene)
            }


            if (mesh) {
                mesh.id = entity.id
                BABYLON.Tags.AddTagsTo(mesh, "editable")

                signalHub.local.emit("mesh_built", { name: mesh.name })
            }
        }
        if (mesh) {
            entity.components.forEach(component => {
                this.setComponent(mesh, component)
            })
            BABYLON.Animation.CreateAndStartAnimation("appear", mesh, "position", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, new BABYLON.Vector3(mesh.position.x, mesh.position.y + 10, mesh.position.z), mesh.position.clone(), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

        }
        return mesh
    }

    animateComponent(mesh: BABYLON.AbstractMesh, component: Component) {

        switch (component.type) {
            case "color":
                const mat = this.findOrCreateMaterial({ type: "color", colorString: component.data.value })
                mesh.material = mat;
                break;
            case "position":
            case "scaling":
                BABYLON.Animation.CreateAndStartAnimation("translate", mesh,
                    component.type, ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, mesh[component.type], BABYLON.Vector3.FromArray(component.data.value), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                break;
            case "rotation":
                const rawValue = component.data.value
                let newQuaternion;
                if (rawValue.length === 3) {
                    // change euler to quaternions
                    newQuaternion = BABYLON.Vector3.FromArray(rawValue).toQuaternion()
                } else {
                    newQuaternion = BABYLON.Quaternion.FromArray(rawValue)
                }
                if (!mesh.rotationQuaternion) {
                    mesh.rotationQuaternion = mesh.rotation.toQuaternion()
                }
                BABYLON.Animation.CreateAndStartAnimation("translate", mesh,
                    "rotationQuaternion", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, mesh.rotationQuaternion, newQuaternion, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                break;
            default:
                console.error("unknown component", component)

        }
    }

    setComponent(mesh: BABYLON.AbstractMesh, component: Component) {

        switch (component.type) {
            case "color":
                const mat = this.findOrCreateMaterial({ type: "color", colorString: component.data.value })
                mesh.material = mat;
                break;
            case "position":
            case "scaling":
                const value = component.data.value
                mesh[component.type].set(value[0], value[1], value[2])
                break;
            case "rotation":
                const rawValue = component.data.value
                let newQuaternion;
                if (rawValue.length === 3) {
                    // change euler to quaternions
                    newQuaternion = BABYLON.Vector3.FromArray(rawValue).toQuaternion()
                } else {
                    newQuaternion = BABYLON.Quaternion.FromArray(rawValue)
                }
                if (mesh.rotationQuaternion === null) {
                    mesh.rotationQuaternion = newQuaternion
                } else {
                    mesh.rotationQuaternion.copyFrom(newQuaternion)
                }
                break;
            default:
                console.warn("unknown component", component)

        }
    }

    run() {
        // run the render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        // the canvas/window resize event handler
        window.addEventListener("resize", () => {
            this.engine.resize();
        });

    }

}