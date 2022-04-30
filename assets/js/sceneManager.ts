import * as BABYLON from "babylonjs"
import Ammo from 'ammojs-typed'
import * as MAT from "babylonjs-materials"
import type { Component, PosRot, scene_settings, serialized_space } from "./types"
import { sessionPersistance } from "./sessionPersistance";
import { MenuManager } from "./menu/menu-manager"
import { reduceSigFigs } from "./utils";
import { XRManager } from "./xr/xr-manager";
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";
import { CollaborativeEditTransformManager } from "./collab-edit/transform";
import { CollabEditDeleteManager } from "./collab-edit/delete";
import { g } from "./menu/helpers";


const ANIMATION_FRAME_PER_SECOND = 60
const TOTAL_ANIMATION_FRAMES = 5

export class SceneManager {
    public canvas: HTMLCanvasElement;
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
    public member_id: string
    public serializedSpace: serialized_space
    public collabEditManager: CollaborativeEditTransformManager
    public collabDeleteManager: CollabEditDeleteManager



    constructor(public orchestrator: Orchestrator) {
        this.canvasId = orchestrator.canvasId
        this.member_id = orchestrator.member_id
        this.serializedSpace = orchestrator.serializedSpace
        this.space_id = this.orchestrator.space_id
        this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
        this.settings = this.serializedSpace.settings
        this.entities = this.serializedSpace.entities
        this.setChannelListeners()

        signalHub.local.on("client_ready").subscribe(async () => {
            this.xrManager = new XRManager(this.orchestrator)
            await this.xrManager.enableWebXRExperience()
            this.menuManager = new MenuManager(this.orchestrator)
        })
    }

    setChannelListeners() {

        signalHub.incoming.on("about_members").subscribe(members => {
            for (const [member_id, payload] of Object.entries(members.movements)) {
                const avatar = this.findOrCreateAvatar(member_id)
                this.setComponent(avatar, { type: "position", data: { value: payload.pos_rot.pos } })
                this.setComponent(avatar, { type: "rotation", data: { value: payload.pos_rot.rot } })
            }
        })


        signalHub.incoming.on("event").subscribe((mpts) => {
            if (mpts.m === "member_entered") {
                const payload = mpts.p
                const avatar = this.findOrCreateAvatar(payload.member_id)
                this.setComponent(avatar, { type: "position", data: { value: payload.pos_rot.pos } })
                this.setComponent(avatar, { type: "rotation", data: { value: payload.pos_rot.rot } })
            } else if (mpts.m === "member_moved") {
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

                // mesh.position.fromArray(pos)
                // if (!mesh.rotationQuaternion) {
                //     mesh.rotationQuaternion = BABYLON.Quaternion.FromArray(rot)
                // } else {
                //     mesh.rotationQuaternion.copyFromFloats(rot[0], rot[1], rot[2], rot[3])
                // }

            } else if (mpts.m === "member_left") {
                this.removeAvatar(mpts.p.member_id)
            } else if (mpts.m === "entity_created") {
                this.findOrCreateMesh(mpts.p)
            } else if (mpts.m === "entity_transformed") {
                let meshes = this.scene.getMeshesById(mpts.p.id)
                meshes.forEach(mesh => {
                    mpts.p.components.forEach(payload => {
                        this.animateComponent(mesh, payload)
                    })
                    // this.setComponent(mesh, { type: mpts.p.type, data: params.data })
                })
            } else if (mpts.m === "entity_colored") {
                let meshes = this.scene.getMeshesById(mpts.p.id)
                meshes.forEach(mesh => {
                    this.setComponent(mesh, { type: "color", data: { value: mpts.p.color } })

                    // this.setComponent(mesh, { type: mpts.p.type, data: params.data })
                })
            } else if (mpts.m === "entity_deleted") {
                let meshes = this.scene.getMeshesById(mpts.p.id)
                meshes.forEach(mesh => {
                    BABYLON.Animation.CreateAndStartAnimation("delete", mesh, "scaling", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, mesh.scaling.clone(), new BABYLON.Vector3(0.01, 0.01, 0.01), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
                        mesh.dispose()
                    });
                })
            } else if (mpts.m === "entity_grabbed") {

                let grabbedEntity = this.scene.getMeshById(mpts.p.entity_id)
                if (grabbedEntity.physicsImpostor) {
                    grabbedEntity.physicsImpostor.dispose()
                    grabbedEntity.physicsImpostor = null
                }
                let handMesh = this.scene.getMeshByName(`avatar_${mpts.p.member_id}_${mpts.p.hand}`)
                if (grabbedEntity && handMesh) {

                    if (mpts.p.member_id === this.member_id) {
                        grabbedEntity.setParent(handMesh)
                    } else {
                        grabbedEntity.parent = null
                        this.setComponent(handMesh, { type: "position", data: { value: mpts.p.hand_pos_rot.pos } })
                        this.setComponent(handMesh, { type: "rotation", data: { value: mpts.p.hand_pos_rot.rot } })
                        this.setComponent(grabbedEntity, { type: "position", data: { value: mpts.p.entity_pos_rot.pos } })
                        this.setComponent(grabbedEntity, { type: "rotation", data: { value: mpts.p.entity_pos_rot.rot } })

                        grabbedEntity.setParent(handMesh)
                    }

                }
            } else if (mpts.m === "entity_released") {
                let grabbedEntity = this.scene.getMeshById(mpts.p.entity_id)
                let handMesh = this.scene.getMeshByName(`avatar_${mpts.p.member_id}_${mpts.p.hand}`)
                if (grabbedEntity && handMesh) {
                    if (mpts.p.member_id === this.member_id) {
                        grabbedEntity.setParent(null)
                    } else {
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
            } else if (mpts.m === "entity_trigger_squeezed") {
                let bullet = BABYLON.MeshBuilder.CreateBox("", { size: 0.05 }, this.scene)
                bullet.position.fromArray(mpts.p.pos)
                let target = bullet.position.add(BABYLON.Vector3.FromArray(mpts.p.direction))
                BABYLON.Animation.CreateAndStartAnimation("bullet", bullet,
                    "position", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, bullet.position.clone(), target, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);


            }
        })

        // signalHub.incoming.on("member_moved").subscribe(({ member_id, pos, rot }) => {
        //     let mesh = this.scene.getMeshByName(`avatar_${member_id}`)

        //     if (mesh) {
        //         mesh.position.fromArray(pos)
        //         if (!mesh.rotationQuaternion) {
        //             mesh.rotationQuaternion = BABYLON.Quaternion.FromArray(rot)
        //         } else {
        //             mesh.rotationQuaternion.copyFromFloats(rot[0], rot[1], rot[2], rot[3])
        //         }
        //     }

        // })
        // signalHub.incoming.on("component_changed").subscribe(params => {
        //     let meshes = this.scene.getMeshesById(params.entity_id)
        //     meshes.forEach(mesh => {
        //         this.setComponent(mesh, { type: params.type, data: params.data })
        //     })
        // })
        // signalHub.incoming.on("BoxCreated").subscribe(event => {
        //     let mesh: BABYLON.AbstractMesh
        //     mesh = this.scene.getMeshById(event.id)
        //     if (!mesh) {
        //         mesh = BABYLON.MeshBuilder.CreateBox(event.name, {}, this.scene)
        //         BABYLON.Tags.AddTagsTo(mesh, "teleportable")
        //     }
        //     const { position, rotation, scaling } = event.components
        //     mesh.position.copyFromFloats(position.x, position.y, position.z)
        // })

        // signalHub.incoming.on("entity_created").subscribe(entity => {
        //     this.findOrCreateMesh(entity)
        // })
        // signalHub.incoming.on("entity_deleted").subscribe(params => {
        //     let meshes = this.scene.getMeshesById(params.id)
        //     meshes.forEach(mesh => {
        //         mesh.dispose()
        //     })
        // })

        // signalHub.incoming.on("new_member").subscribe(({ member_id, pos_rot }) => {
        //     this.findOrCreateAvatar(member_id, pos_rot)
        // })

        // signalHub.incoming.on("members").subscribe(({ movements }) => {
        //     Object.entries(movements).forEach(([member_id, payload]) => {
        //         if (member_id != this.member_id) {
        //             this.findOrCreateAvatar(member_id, payload.pos_rot)
        //         }
        //     })
        // })


        // signalHub.incoming.on("presence_diff").subscribe(params => {

        //     Object.keys(params.leaves).map(id => {
        //         this.removeAvatar(id)
        //     })
        // })

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

    findOrCreateAvatarHand(member_id: string, hand: string, pos_rot: PosRot) {
        let mesh = this.scene.getMeshByName(`avatar_${member_id}_${hand}`)
        if (!mesh) {
            mesh = BABYLON.MeshBuilder.CreateBox(`avatar_${member_id}_${hand}`, { size: 0.1 }, this.scene)
            mesh.isPickable = false
            mesh.position.fromArray(pos_rot.pos)
            mesh.rotationQuaternion = BABYLON.Quaternion.FromArray(pos_rot.rot)
        } else {
            this.animateComponent(mesh, { type: "position", data: { value: pos_rot.pos } })
            this.animateComponent(mesh, { type: "rotation", data: { value: pos_rot.rot } })
        }

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
        this.parseInitialScene(this.entities)
        this.collabEditManager = new CollaborativeEditTransformManager(this.scene)
        this.collabDeleteManager = new CollabEditDeleteManager(this.scene)
        return this.scene;

    }


    removeAvatar(id) {
        let box = this.scene.getMeshByName(`avatar_${id}`)
        if (box) {
            box.dispose()
        }
        this.removeAvatarHand(id, "left")
        this.removeAvatarHand(id, "right")
    }

    findOrCreateAvatar(member_id: string) {
        let box = this.scene.getMeshByName(`avatar_${member_id}`)
        if (!box) {
            box = BABYLON.MeshBuilder.CreateBox(`avatar_${member_id}`, { size: 0.3 }, this.scene)
            box.isPickable = false
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



    parseInitialScene(entities) {
        entities.map(entity => {
            this.findOrCreateMesh(entity)
        })
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


    findOrCreateMesh(entity: { type: string, name: string, id: string, components: Component[], parent?: string }) {

        let mesh: BABYLON.AbstractMesh
        mesh = this.scene.getMeshById(entity.id)
        if (!mesh) {

            if (entity.type === "box") {
                mesh = BABYLON.MeshBuilder.CreateBox(entity.name, {}, this.scene)
                BABYLON.Tags.AddTagsTo(mesh, "teleportable")
            } else if (entity.type === "gun") {
                mesh = BABYLON.MeshBuilder.CreateTorus("gun", {}, this.scene)
                BABYLON.Tags.AddTagsTo(mesh, "interactable shootable")
            } else if (entity.type === "capsule") {
                mesh = BABYLON.MeshBuilder.CreateCapsule("capsule", {}, this.scene)
                BABYLON.Tags.AddTagsTo(mesh, "interactable physics")
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
            } else if (entity.type === "cone") {
                mesh = BABYLON.MeshBuilder.CreateCylinder(entity.name, { diameterTop: 0 }, this.scene)
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
                    component.type, ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, mesh[component.type].clone(), BABYLON.Vector3.FromArray(component.data.value), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
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

                BABYLON.Animation.CreateAndStartAnimation("translate", mesh,
                    "rotationQuaternion", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, mesh.rotationQuaternion.clone(), newQuaternion, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
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
                console.error("unknown component", component)

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

        // this.menuManager.test()
    }

}