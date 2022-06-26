import * as BABYLON from "babylonjs"
import Ammo from 'ammojs-typed'

import * as MAT from "babylonjs-materials"
import type { Component, PosRot, scene_settings, serialized_space } from "./types"
import { sessionPersistance } from "./sessionPersistance";
import { MenuManager } from "./menu/menu-manager"
import { reduceSigFigs } from "./utils";
import { XRManager } from "./xr/xr-manager";

import { signalHub } from "./signalHub";
import { DamageOverlay } from "./damage-overlay";
import { isMobileVR } from "./utils";
import { HudMessager } from "./hud-message";
import { BulletManager } from "./scene/bullet-manager";

import { EventName } from "./event-names"
import { NavManager } from "./scene/nav-manager";
import { createWall } from "./scene/constructs";


const ANIMATION_FRAME_PER_SECOND = 60
const TOTAL_ANIMATION_FRAMES = 5

export class SceneManager {
    public canvas: HTMLCanvasElement
    public scene: BABYLON.Scene;
    public engine: BABYLON.Engine;
    public entities: any[]
    public skyBox: BABYLON.Mesh
    public settings: scene_settings
    public space_id: string;
    public menuManager: MenuManager
    public freeCamera: BABYLON.FreeCamera
    public xrManager: XRManager
    public canvasId: string
    public bulletManager: BulletManager

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
        window['sceneManager'] = this
    }

    initLeaderDuties() {
        // this.entities
        //     .filter(entity => entity.type === "enemy_spawner")
        //     .forEach(spawner => {

        //         this.navManager.agentManager.addAgentSpawnPoint(spawner.name)
        //     })

        // this.navManager.agentManager.startSpawning()
        // this.navManager.agentManager.planMovementForAllAgents()
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

        signalHub.incoming.on("about_members").subscribe(members => {
            for (const [member_id, payload] of Object.entries(members.movements)) {
                const avatar = this.findOrCreateAvatar(member_id)
                this.setComponent(avatar, { type: "position", data: { value: payload.pos_rot.pos } })
                this.setComponent(avatar, { type: "rotation", data: { value: payload.pos_rot.rot } })
            }
        })


        signalHub.incoming.on("event").subscribe((mpts) => {
            if (mpts.m === EventName.member_entered) {
                const payload = mpts.p
                const avatar = this.findOrCreateAvatar(payload.member_id)
                this.setComponent(avatar, { type: "position", data: { value: payload.pos_rot.pos } })
                this.setComponent(avatar, { type: "rotation", data: { value: payload.pos_rot.rot } })
            } else if (mpts.m === EventName.member_moved) {
                const payload = mpts.p
                const avatar = this.findOrCreateAvatar(payload.member_id)
                this.animateComponent(avatar, { type: "position", data: { value: payload.pos_rot.pos } })
                this.animateComponent(avatar, { type: "rotation", data: { value: payload.pos_rot.rot } })
                if (payload.left) {
                    this.findOrCreateAvatarHand(payload.member_id, "left", payload.left)
                }
                if (payload.right) {
                    this.findOrCreateAvatarHand(payload.member_id, "right", payload.right)
                }


            } else if (mpts.m === EventName.member_left) {
                this.removeAvatar(mpts.p.member_id)
            } else if (mpts.m === EventName.entity_created) {
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
            } else if (mpts.m === EventName.entity_grabbed) {

                let grabbedEntity = this.scene.getMeshById(mpts.p.entity_id)
                if (grabbedEntity.physicsImpostor) {
                    grabbedEntity.physicsImpostor.dispose()
                    grabbedEntity.physicsImpostor = null
                }
                const meshName = `avatar_${mpts.p.member_id}_${mpts.p.hand}`

                let handMesh = this.scene.getMeshByName(meshName)
                if (grabbedEntity && handMesh) {
                    // don't positions for yourself because you have most up to date info per frame
                    // also your hand is parented to a controller grip, so if you move it,
                    // it will move in local coordinate space and be screwed up
                    if (mpts.p.member_id !== this.member_id) {
                        // unparent incase was grabbed by someone else first
                        grabbedEntity.parent = null
                        this.setComponent(handMesh, { type: "position", data: { value: mpts.p.hand_pos_rot.pos } })
                        this.setComponent(handMesh, { type: "rotation", data: { value: mpts.p.hand_pos_rot.rot } })
                        this.setComponent(grabbedEntity, { type: "position", data: { value: mpts.p.entity_pos_rot.pos } })
                        this.setComponent(grabbedEntity, { type: "rotation", data: { value: mpts.p.entity_pos_rot.rot } })


                    }
                    let tags = <string[]>BABYLON.Tags.GetTags(grabbedEntity)

                    // if shootable, we assign parent instead of setParent
                    // assign will snap child local space into parent space
                    if (tags.includes("shootable")) {
                        grabbedEntity.position.copyFromFloats(0, 0, 0)
                        grabbedEntity.rotationQuaternion.copyFromFloats(0, 0, 0, 1)
                        grabbedEntity.parent = handMesh
                    } else {
                        // keeps world space offset during the parenting
                        grabbedEntity.setParent(handMesh)
                    }

                }
            } else if (mpts.m === EventName.entity_released) {
                let grabbedEntity = this.scene.getMeshById(mpts.p.entity_id)
                const meshName = `avatar_${mpts.p.member_id}_${mpts.p.hand}`


                let handMesh = this.scene.getMeshByName(meshName)

                if (grabbedEntity && handMesh) {
                    if (mpts.p.member_id === this.member_id) {

                        // locally we're the one moving so we don't need to update position
                        // keep it where it is
                        grabbedEntity.setParent(null)
                    } else {
                        // unset previous grab
                        grabbedEntity.parent = null
                        this.setComponent(handMesh, { type: "position", data: { value: mpts.p.hand_pos_rot.pos } })
                        this.setComponent(handMesh, { type: "rotation", data: { value: mpts.p.hand_pos_rot.rot } })
                        this.setComponent(grabbedEntity, { type: "position", data: { value: mpts.p.entity_pos_rot.pos } })
                        this.setComponent(grabbedEntity, { type: "rotation", data: { value: mpts.p.entity_pos_rot.rot } })
                    }
                    if (mpts.p.lv) {
                        grabbedEntity.physicsImpostor = new BABYLON.PhysicsImpostor(grabbedEntity, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, friction: 0.8, restitution: 0.5 }, this.scene);
                        grabbedEntity.physicsImpostor.setLinearVelocity(BABYLON.Vector3.FromArray(mpts.p.lv))
                        grabbedEntity.physicsImpostor.setAngularVelocity(BABYLON.Vector3.FromArray(mpts.p.av))
                    }


                }
            }
        })


        signalHub.incoming.on("space_settings_changed").subscribe(params => {
            this.processscene_settings(params as scene_settings)

        })

    }

    removeAvatarHand(member_id: string, hand: string) {
        let mesh = this.scene.getMeshByName(`avatar_${member_id}_${hand}`)
        if (mesh) {
            mesh.dispose()
        }
    }

    findOrCreateAvatarHand(member_id: string, hand: string, pos_rot: PosRot): BABYLON.AbstractMesh {
        const meshName = `avatar_${member_id}_${hand}`
        let mesh = this.scene.getMeshByName(meshName)
        if (!mesh) {
            mesh = BABYLON.MeshBuilder.CreateBox(meshName, { size: 0.1 }, this.scene)
            mesh.isPickable = false
            mesh.position.fromArray(pos_rot.pos)
            mesh.rotationQuaternion = BABYLON.Quaternion.FromArray(pos_rot.rot)
        } else {
            this.animateComponent(mesh, { type: "position", data: { value: pos_rot.pos } })
            this.animateComponent(mesh, { type: "rotation", data: { value: pos_rot.rot } })
        }
        return mesh
    }




    async createScene() {
        // Create a basic BJS Scene object
        this.scene = new BABYLON.Scene(this.engine);

        var gravityVector = new BABYLON.Vector3(0, -9.81, 0);
        const ammo = await Ammo()

        var physicsPlugin = new BABYLON.AmmoJSPlugin(true, ammo);
        this.scene.enablePhysics(gravityVector, physicsPlugin);

        this.processscene_settings(this.settings as scene_settings)
        window["scene"] = this.scene
        this.createCamera()

        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.navManager = new NavManager(this.space_id, this.scene)
        await this.parseInitialScene(this.entities)

        this.xrManager = new XRManager(this.member_id, this.scene)
        this.menuManager = new MenuManager(this.scene, this.xrManager)

        new DamageOverlay(this.member_id, this.scene)
        new HudMessager(this.scene)
        this.bulletManager = new BulletManager(this.member_id, this.scene)

        return this.scene;

    }


    removeAvatar(member_id: string) {
        let box = this.scene.getMeshByName(`avatar_${member_id}`)
        if (box) {
            box.dispose()
        }
        this.removeAvatarHand(member_id, "left")
        this.removeAvatarHand(member_id, "right")
    }

    findOrCreateAvatar(member_id: string) {
        let box = this.scene.getMeshByName(`avatar_${member_id}`)
        if (!box) {
            box = BABYLON.MeshBuilder.CreateBox(`avatar_${member_id}`, { size: 0.3 }, this.scene)
            //  box.isPickable = false
            box.metadata ||= {}
            box.metadata['member_id'] = member_id
            BABYLON.Tags.AddTagsTo(box, "avatar")
        }
        return box
    }


    findSpawnPoint() {
        const result = this.entities.filter(entity => entity.type === "spawn_point")
        if (result.length > 0) {
            let pos = result[0].components[0].data
            return { pos: [pos.x, pos.y, pos.z], rot: [0, 0, 0, 1] }
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

    async createCamera() {
        let posRot = this.getLastPosRot()
        this.freeCamera = new BABYLON.FreeCamera("freeCam", BABYLON.Vector3.FromArray(posRot.pos), this.scene);
        this.freeCamera.rotationQuaternion = BABYLON.Quaternion.FromArray(posRot.rot)
        // Attach the camera to the canvas
        this.freeCamera.attachControl(this.canvas, true);
        this.freeCamera.inertia = 0.7;
        this.freeCamera.minZ = 0.05
        this.freeCamera.onViewMatrixChangedObservable.add(cam => {
            signalHub.movement.emit("camera_moved", { pos: cam.position.asArray(), rot: cam.absoluteRotation.asArray() })
        })

        //  const env = this.scene.createDefaultEnvironment();

        // signalHub.local.next({ event: "camera_ready", payload: {} })
        signalHub.local.emit("camera_ready", posRot)
        // this.tempMenu()

        addEventListener("beforeunload", () => {
            let cam = this.scene.activeCamera
            let pos = cam.position.asArray().map(reduceSigFigs)
            let rot = cam.absoluteRotation.asArray().map(reduceSigFigs)
            sessionPersistance.saveCameraPosRot({ pos, rot })
        }, { capture: true });


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
                console.log('getClassName', result.getClassName(), result.name)
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
            } else if (entity.type === "capsule") {
                mesh = BABYLON.MeshBuilder.CreateCapsule("capsule", {}, this.scene)
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