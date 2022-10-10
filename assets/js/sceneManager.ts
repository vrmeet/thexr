import * as BABYLON from "babylonjs";
import Ammo from "ammojs-typed";

import * as MAT from "babylonjs-materials";
import type { Component, scene_settings, serialized_space } from "./types";
import { sessionPersistance } from "./sessionPersistance";
import { MenuManager } from "./menu/menu-manager";

import { XRManager } from "./xr/xr-manager";

import { signalHub } from "./signalHub";
import { TintOverlay } from "./tint-overlay";

import { HudMessager } from "./hud-message";
import { BulletManager } from "./scene/bullet-manager";

import { EventName } from "./event-names";
import { createWall } from "./scene/constructs";
import { filter } from "rxjs/operators";

import { Inline } from "./scene/inline";

import { CollectManager } from "./scene/collect-manager";
import { AvatarManager } from "./scene/avatar-manager";
import { DoorManager } from "./scene/door-manager";
import { AgentManager } from "./scene/agent-manager";

import { mode } from "./mode";
import { BoxEntity } from "./scene/entities/box-entity";

import { GridEntity } from "./scene/entities/grid-entity";
import { WallEntity } from "./scene/entities/wall-entity";
import { SpawnPointEntity } from "./scene/entities/spawn-point-entity";
import { EnemySpawnerEntity } from "./scene/entities/enemy-spawner-entity";
import { AmmoBoxEntity } from "./scene/entities/ammo-box-entity";
import { CylinderEntity } from "./scene/entities/cylinder-entity";
import { GunEntity } from "./scene/entities/gun-entity";
import { PlaneEntity } from "./scene/entities/plane-entity";
import { SphereEntity } from "./scene/entities/sphere-entity";
import { ConeEntity } from "./scene/entities/cone-entity";
import { CapsuleEntity } from "./scene/entities/capsule-entity";
import { reduceSigFigs } from "./utils/misc";
import { isMobileVR } from "./utils/utils-browser";

const ANIMATION_FRAME_PER_SECOND = 60;
const TOTAL_ANIMATION_FRAMES = 5;

export class SceneManager {
  public canvas: HTMLCanvasElement;
  public scene: BABYLON.Scene;
  public engine: BABYLON.Engine;
  public entities: {
    id: string;
    type: string;
    name: string;
    parent: string;
    components: { type: string; data: { value: any } }[];
  }[];
  public skyBox: BABYLON.Mesh;
  public settings: scene_settings;
  public space_id: string;
  public menuManager: MenuManager;
  public freeCamera: BABYLON.FreeCamera;
  public xrManager: XRManager;
  public canvasId: string;
  public bulletManager: BulletManager;
  public avatarManager: AvatarManager;
  public tintOverlay: TintOverlay;
  public inline: Inline;

  public collectManager: CollectManager;
  public doorManager: DoorManager;
  public agentManager: AgentManager;

  constructor(
    public member_id: string,
    public serializedSpace: serialized_space
  ) {
    this.space_id = this.serializedSpace.id;
    this.canvas = document.getElementById(this.space_id) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    this.settings = this.serializedSpace.settings;
    this.entities = this.serializedSpace.entities;

    this.setChannelListeners();

    signalHub.local.on("client_ready").subscribe(async () => {
      await this.xrManager.enableWebXRExperience();

      if (isMobileVR()) {
        this.xrManager.enterXR();
      } else {
        this.inline.bindInlineEvents();
      }

      // falling objects should not fall for ever
      // setInterval(() => {
      //     const meshes = this.scene.getMeshesByTags("physics || targetable")
      //     meshes.forEach(mesh => {
      //         if (mesh.absolutePosition.y < -10) {
      //             if (mesh.physicsImpostor) {
      //                 mesh.physicsImpostor.dispose()
      //                 mesh.physicsImpostor = null
      //             }
      //             mesh.position.copyFromFloats(Math.random() * 10 - 5, 1, Math.random() * 10 - 5)
      //         }
      //     })
      // }, 10000)
    });

    signalHub.incoming
      .on("event")
      .pipe(
        filter(
          (evt) =>
            evt.m === EventName.member_died &&
            evt.p["member_id"] === this.member_id
        )
      )
      .subscribe(() => {
        signalHub.incoming.emit("hud_msg", "Respawning in 15 seconds");
        setTimeout(() => {
          const spawnPosRot = this.findSpawnPoint();

          // add some height for the head
          const pos = [
            spawnPosRot.pos[0],
            spawnPosRot.pos[1] + mode.height,
            spawnPosRot.pos[2],
          ];

          signalHub.outgoing.emit("event", {
            m: EventName.member_respawned,
            p: { member_id: this.member_id, pos_rot: { ...spawnPosRot, pos } },
          });
        }, 15000);
      });

    window["sceneManager"] = this;
  }

  setChannelListeners() {
    signalHub.incoming.on("new_leader").subscribe(({ member_id }) => {
      if (this.member_id === member_id) {
        mode.leader = true;
      } else {
        mode.leader = false;
      }
    });

    signalHub.incoming.on("about_space").subscribe((about_space) => {
      // temp reposition of entities, like opened doors
      for (const [entity_id, event] of Object.entries(about_space.entities)) {
        if (event.m === EventName.entity_animated_to) {
          const entity = this.scene.getMeshById(event.p.entity_id);
          if (entity) {
            if (event.p.pos) {
              entity.position.fromArray(event.p.pos);
            }
          }
        }
      }
    });

    signalHub.incoming.on("event").subscribe((mpts) => {
      if (mpts.m === EventName.entity_created) {
        this.findOrCreateMesh(mpts.p);
      } else if (mpts.m === EventName.entity_transformed) {
        const meshes = this.scene.getMeshesById(mpts.p.id);
        meshes.forEach((mesh) => {
          mpts.p.components.forEach((payload) => {
            this.animateComponent(mesh, payload);
          });
          // this.setComponent(mesh, { type: mpts.p.type, data: params.data })
        });
      } else if (mpts.m === EventName.entity_animated_to) {
        const mesh = this.scene.getMeshById(mpts.p.entity_id);
        if (mesh) {
          if (mpts.p.pos) {
            BABYLON.Animation.CreateAndStartAnimation(
              "translate",
              mesh,
              "position",
              ANIMATION_FRAME_PER_SECOND,
              Math.ceil((mpts.p.duration * 60) / 1000),
              mesh.position,
              BABYLON.Vector3.FromArray(mpts.p.pos),
              BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
          }
        }
      } else if (mpts.m === EventName.entity_colored) {
        const meshes = this.scene.getMeshesById(mpts.p.id);
        meshes.forEach((mesh) => {
          this.setComponent(mesh, {
            type: "color",
            data: { value: mpts.p.color },
          });

          // this.setComponent(mesh, { type: mpts.p.type, data: params.data })
        });
      } else if (mpts.m === EventName.entity_deleted) {
        const meshes = this.scene.getMeshesById(mpts.p.id);
        meshes.forEach((mesh) => {
          BABYLON.Animation.CreateAndStartAnimation(
            "delete",
            mesh,
            "scaling",
            ANIMATION_FRAME_PER_SECOND,
            TOTAL_ANIMATION_FRAMES,
            mesh.scaling.clone(),
            new BABYLON.Vector3(0.01, 0.01, 0.01),
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            null,
            () => {
              mesh.dispose();
            }
          );
        });
      }
    });

    signalHub.incoming.on("space_settings_changed").subscribe((params) => {
      this.processscene_settings(params as scene_settings);
    });
  }
  async createScene() {
    // Create a basic BJS Scene object
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.collisionsEnabled = true;

    this.scene.onPointerObservable.add((pointerInfo) => {
      signalHub.local.emit("pointer_info", pointerInfo);
      if (
        pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK &&
        pointerInfo.pickInfo.hit &&
        pointerInfo.pickInfo.pickedMesh
      ) {
        signalHub.local.emit("mesh_picked", pointerInfo.pickInfo.pickedMesh);
      }
    });

    this.scene.onKeyboardObservable.add((keyboardInfo) => {
      signalHub.local.emit("keyboard_info", keyboardInfo);
    });

    this.scene.metadata = { member_id: this.member_id }; // this is so often needed along with the scene, I can make this available inside the scene

    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const ammo = await Ammo();

    const physicsPlugin = new BABYLON.AmmoJSPlugin(true, ammo);
    this.scene.enablePhysics(gravityVector, physicsPlugin);

    this.processscene_settings(this.settings as scene_settings);
    window["scene"] = this.scene;
    this.createCamera();

    // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
    const light = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    // this.navManager = new NavManager(this.member_id, this.space_id, this.scene)

    await this.parseInitialScene(this.entities);

    this.xrManager = new XRManager(this.member_id, this.scene);
    this.menuManager = new MenuManager(this.scene, this.xrManager);

    this.tintOverlay = new TintOverlay(this.member_id, this.scene);
    new HudMessager(this.scene);
    this.bulletManager = new BulletManager(this.member_id, this.scene);

    this.collectManager = new CollectManager(this.member_id, this.scene);
    this.doorManager = new DoorManager(this.member_id, this.scene);

    this.avatarManager = new AvatarManager(this.member_id, this.scene);
    this.agentManager = new AgentManager(this.member_id, this.scene);

    return this.scene;
  }

  findSpawnPoint() {
    // TODO, might be more efficient to use Tags but the meshes aren't built yet
    const result = this.entities.filter(
      (entity) => entity.type === "spawn_point"
    );
    if (result.length > 0) {
      const firstSpawnPoint = result[0];
      const positionData = firstSpawnPoint.components.filter(
        (c) => c.type === "position"
      )[0].data.value;
      // we'll only take the y rotation into consideration
      const rotationData = firstSpawnPoint.components.filter(
        (c) => c.type === "rotation"
      )[0].data.value;
      const rot = BABYLON.Vector3.FromArray([0, rotationData[1], 0])
        .toQuaternion()
        .asArray();
      return { pos: positionData, rot: rot };
    } else {
      return { pos: [0, 0.01, -8], rot: [0, 0, 0, 1] };
    }
  }

  getLastPosRot() {
    const camPosRot = sessionPersistance.getCameraPosRot();
    if (!camPosRot) {
      const spawnPoint = this.findSpawnPoint();
      // since a spawn point is usually on the floor, raise it up to the camera head height
      const camPoint = { pos: [...spawnPoint.pos], rot: [...spawnPoint.rot] };
      camPoint.pos[1] += mode.height;
      sessionPersistance.saveCameraPosRot(camPoint);
      return camPoint;
    } else {
      return camPosRot;
    }
  }

  createCamera() {
    const posRot = this.getLastPosRot();
    this.freeCamera = new BABYLON.FreeCamera(
      "freeCam",
      BABYLON.Vector3.FromArray(posRot.pos),
      this.scene
    );
    this.freeCamera.rotationQuaternion = BABYLON.Quaternion.FromArray(
      posRot.rot
    );
    this.freeCamera.ellipsoid = new BABYLON.Vector3(0.25, 0.1, 0.25);
    this.freeCamera.checkCollisions = true;
    // setup tools for 2D grabbing and avatar
    this.inline = new Inline(this.member_id, this.scene, this.freeCamera);
    signalHub.local.emit("camera_ready", posRot);

    addEventListener(
      "beforeunload",
      () => {
        const cam = this.scene.activeCamera;
        const pos = cam.position.asArray().map(reduceSigFigs);
        const rot = cam.absoluteRotation.asArray().map(reduceSigFigs);
        sessionPersistance.saveCameraPosRot({ pos, rot });
      },
      { capture: true }
    );

    return this.freeCamera;
  }

  findOrCreateSkyBox() {
    if (!this.skyBox) {
      this.skyBox = BABYLON.MeshBuilder.CreateBox(`${this.space_id}_skybox`, {
        size: 50,
      });
      this.skyBox.infiniteDistance = true;
      const skyboxMaterial = new MAT.SkyMaterial("skyMaterial", this.scene);
      skyboxMaterial.backFaceCulling = false;
      this.skyBox.material = skyboxMaterial;
    }
    return this.skyBox;
  }
  processSkybox(useSkybox: boolean, inclination: number) {
    if (useSkybox) {
      this.findOrCreateSkyBox();
      const skyboxMaterial = this.skyBox.material as MAT.SkyMaterial;
      skyboxMaterial.inclination = inclination;
    } else {
      if (this.skyBox) {
        this.skyBox.material.dispose();
        this.skyBox.dispose();
        this.skyBox = null;
      }
    }
  }

  processscene_settings(settings: scene_settings) {
    this.scene.clearColor = BABYLON.Color4.FromHexString(settings.clear_color);
    this.processSkybox(settings.use_skybox, settings.skybox_inclination);
    this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    this.scene.fogColor = BABYLON.Color3.FromHexString(settings.fog_color);
    this.scene.fogDensity = settings.fog_density;
  }

  parseEntity(entity): any {
    return this.findOrCreateMesh(entity);
  }

  async parseInitialScene(entities) {
    const meshes = entities.reduce((acc, entity) => {
      const result = this.parseEntity(entity);
      if (
        result &&
        typeof result["getClassName"] === "function" &&
        result.getClassName() === "Mesh"
      ) {
        acc.push(result);
      }
      return acc;
    }, []);

    // await this.navManager.loadOrMakeNavMesh(meshes)
  }

  findOrCreateMaterial(opts: { type: "color" | "grid"; colorString?: string }) {
    if (opts.type === "color" && opts.colorString) {
      const mat = this.scene.getMaterialByName(`mat_${opts.colorString}`);
      if (mat) {
        return mat;
      } else {
        const myMaterial = new BABYLON.StandardMaterial(
          `mat_${opts.colorString}`,
          this.scene
        );
        const color = BABYLON.Color3.FromHexString(opts.colorString);
        myMaterial.diffuseColor = color;
        return myMaterial;
      }
    } else {
      return (
        this.scene.getMaterialByName("mat_grid") ||
        new MAT.GridMaterial("mat_grid", this.scene)
      );
    }
  }

  argifyComponents(components: { type: string; data: { value: any } }[]) {
    const blackList = ["scaling", "position", "rotation"];
    return components.reduce((acc, component) => {
      if (!blackList.includes(component.type)) {
        acc[component.type] = component.data.value;
      }
      return acc;
    }, {});
  }

  findOrCreateMesh(entity: {
    type: string;
    name: string;
    id: string;
    components: Component[];
    parent?: string;
  }): BABYLON.AbstractMesh {
    let mesh: BABYLON.AbstractMesh;
    mesh = this.scene.getMeshById(entity.id);
    if (!mesh) {
      if (entity.type === "box") {
        mesh = new BoxEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );
      } else if (entity.type === "spawn_point") {
        mesh = new SpawnPointEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );
        // mesh = BABYLON.MeshBuilder.CreateBox(entity.name, { width: 1, depth: 1, height: 0.05 }, this.scene)
      } else if (entity.type === "wall") {
        mesh = new WallEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );
      } else if (
        entity.type === "door" ||
        entity.type === "red_door" ||
        entity.type === "blue_door"
      ) {
        const height: number = (entity.components.filter(
          (comp) => comp.type === "height"
        )[0]?.data?.value || 2) as number;
        const points: number[] = entity.components.filter(
          (comp) => comp.type === "points"
        )[0].data.value as number[];
        mesh = createWall(entity.name, height, points, this.scene);
        mesh.checkCollisions = true;
        BABYLON.Tags.AddTagsTo(mesh, "blocker");
      } else if (entity.type === "cylinder") {
        mesh = new CylinderEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );
      } else if (entity.type === "gun") {
        mesh = new GunEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );

        // let barrel = BABYLON.MeshBuilder.CreateBox(entity.name, { width: 0.05, depth: 0.25, height: 0.05 }, this.scene)
        // barrel.position.z = 0.07
        // barrel.position.y = 0.05
        // let handle = BABYLON.MeshBuilder.CreateBox(entity.name, { width: 0.05, depth: 0.07, height: 0.15 }, this.scene)
        // handle.rotation.x = BABYLON.Angle.FromDegrees(45).radians()
        // mesh = BABYLON.Mesh.MergeMeshes([barrel, handle], true);
        // entity.components.push({ type: "color", data: { value: "#A0A0A0" } })
        // // mesh = BABYLON.MeshBuilder.CreateTorus("gun", {}, this.scene)
        // BABYLON.Tags.AddTagsTo(mesh, "interactable shootable")
      } else if (entity.type === "red_key" || entity.type === "blue_key") {
        mesh = BABYLON.MeshBuilder.CreateBox(
          entity.name,
          { width: 0.15, depth: 0.01, height: 0.2 },
          this.scene
        );
        BABYLON.Tags.AddTagsTo(mesh, "interactable collectable");
      } else if (entity.type === "ammo_box") {
        mesh = new AmmoBoxEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );

        // mesh = BABYLON.MeshBuilder.CreateBox(entity.name, { width: 0.5, depth: 0.3, height: 0.5 }, this.scene)
        // BABYLON.Tags.AddTagsTo(mesh, "interactable collectable")
      } else if (entity.type === "capsule") {
        mesh = new CapsuleEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );

        // mesh = BABYLON.MeshBuilder.CreateCapsule(entity.name, {}, this.scene)
        // BABYLON.Tags.AddTagsTo(mesh, "interactable targetable physics")
      } else if (entity.type === "plane") {
        mesh = new PlaneEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );

        // mesh = BABYLON.MeshBuilder.CreatePlane(entity.name, { sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
        // mesh.checkCollisions = true
      } else if (entity.type === "grid") {
        mesh = new GridEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );

        // mesh = BABYLON.MeshBuilder.CreatePlane(entity.name, { size: 25, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene)
        // mesh.checkCollisions = true
        // mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.7 }, this.scene);

        // const gridMat = this.findOrCreateMaterial({ type: "grid" })
        // mesh.material = gridMat;

        // BABYLON.Tags.AddTagsTo(mesh, "teleportable")
      } else if (entity.type === "sphere") {
        mesh = new SphereEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );

        // mesh = BABYLON.MeshBuilder.CreateSphere(entity.name, {}, this.scene)
        // BABYLON.Tags.AddTagsTo(mesh, "interactable targetable physics")
      } else if (entity.type === "cone") {
        mesh = new ConeEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );

        // mesh = BABYLON.MeshBuilder.CreateCylinder(entity.name, { diameterTop: 0 }, this.scene)
        // BABYLON.Tags.AddTagsTo(mesh, "interactable targetable physics")
      } else if (entity.type === "enemy_spawner") {
        mesh = new EnemySpawnerEntity(this.scene).buildMeshFromEvent(
          entity.id,
          entity.name,
          entity.components
        );

        // mesh = BABYLON.MeshBuilder.CreateBox(entity.name, { width: 1, depth: 1, height: 0.1 }, this.scene)
        // BABYLON.Tags.AddTagsTo(mesh, "enemy_spawner")
      }

      // if (mesh) {
      //     mesh.id = entity.id
      //     mesh.metadata = { type: entity.type }
      //     BABYLON.Tags.AddTagsTo(mesh, "editable")
      //     // signal to teleportation manager
      //     signalHub.local.emit("mesh_built", { name: mesh.name, type: entity.type })
      // }
    }
    if (mesh["mesh"]) {
      return mesh["mesh"];
    } else {
      return mesh as BABYLON.AbstractMesh;
    }
  }

  animateComponent(mesh: BABYLON.AbstractMesh, component: Component) {
    switch (component.type) {
      case "color":
        const mat = this.findOrCreateMaterial({
          type: "color",
          colorString: component.data.value,
        });
        mesh.material = mat;
        break;
      case "position":
      case "scaling":
        BABYLON.Animation.CreateAndStartAnimation(
          "translate",
          mesh,
          component.type,
          ANIMATION_FRAME_PER_SECOND,
          TOTAL_ANIMATION_FRAMES,
          mesh[component.type],
          BABYLON.Vector3.FromArray(component.data.value),
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        break;
      case "rotation":
        const rawValue = component.data.value;
        let newQuaternion;
        if (rawValue.length === 3) {
          // change euler to quaternions
          newQuaternion = BABYLON.Vector3.FromArray(rawValue).toQuaternion();
        } else {
          newQuaternion = BABYLON.Quaternion.FromArray(rawValue);
        }
        if (!mesh.rotationQuaternion) {
          mesh.rotationQuaternion = mesh.rotation.toQuaternion();
        }
        BABYLON.Animation.CreateAndStartAnimation(
          "translate",
          mesh,
          "rotationQuaternion",
          ANIMATION_FRAME_PER_SECOND,
          TOTAL_ANIMATION_FRAMES,
          mesh.rotationQuaternion,
          newQuaternion,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        break;
      default:
      // console.error("unknown component", component)
    }
  }

  setComponent(mesh: BABYLON.AbstractMesh, component: Component) {
    switch (component.type) {
      case "color":
        const mat = this.findOrCreateMaterial({
          type: "color",
          colorString: component.data.value,
        });
        mesh.material = mat;
        break;
      case "position":
      case "scaling":
        const value = component.data.value;
        mesh[component.type].set(value[0], value[1], value[2]);
        break;
      case "rotation":
        const rawValue = component.data.value;
        let newQuaternion;
        if (rawValue.length === 3) {
          // change euler to quaternions
          newQuaternion = BABYLON.Vector3.FromArray(rawValue).toQuaternion();
        } else {
          newQuaternion = BABYLON.Quaternion.FromArray(rawValue);
        }
        if (mesh.rotationQuaternion === null) {
          mesh.rotationQuaternion = newQuaternion;
        } else {
          mesh.rotationQuaternion.copyFrom(newQuaternion);
        }
        break;
      default:
        mesh.metadata[component.type] = component.data.value;
      // console.warn("unknown component", component)
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
