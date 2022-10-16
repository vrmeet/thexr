import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";
import { arrayReduceSigFigs, random_id } from "../../utils/misc";

export class SystemSerializedMesh implements ISystem {
  public meshes: Record<string, BABYLON.AbstractMesh> = {};
  public name = "serialized_mesh";
  public order = 0;
  public context: Context;
  init(context: Context) {
    this.context = context;
  }

  async registerEntity(entity_id: string, components: ComponentObj) {
    if (components.serialized_mesh) {
      if (!this.meshes[entity_id]) {
        return this.createMesh(entity_id);
      }
    }
  }

  upsertComponents(entity_id: string, components: ComponentObj): void {
    if (
      components.serialized_mesh !== undefined &&
      this.meshes[entity_id] !== undefined
    ) {
      // recreate the mesh
      this.meshes[entity_id].dispose();
      this.createMesh(entity_id);
    }
  }

  deregisterEntity(entity_id: string): void {
    if (this.meshes[entity_id] !== undefined) {
      this.meshes[entity_id].dispose();
      delete this.meshes[entity_id];
    }
  }

  intersect(meshA: BABYLON.Mesh, meshB: BABYLON.Mesh) {
    const csgA = BABYLON.CSG.FromMesh(meshA);
    const csgB = BABYLON.CSG.FromMesh(meshB);
    const csgIntersected = csgA.intersect(csgB);
    const newMesh = csgIntersected.toMesh(
      `intersected_${random_id(5)}`,
      null,
      this.context.scene,
      false
    );
    // const center = newMesh.getBoundingInfo().boundingBox.center;
    // newMesh.position.subtractInPlace(center);
    // newMesh.bakeCurrentTransformIntoVertices();
    // newMesh.position = center;
    const serializedMesh = BABYLON.SceneSerializer.SerializeMesh(newMesh);
    this.context.channel.push("save_serialized_mesh", {
      entity_id: newMesh.name,
      data: serializedMesh,
    });
    this.context.signalHub.outgoing.emit("entities_deleted", {
      ids: [meshA.name, meshB.name],
    });
    this.context.signalHub.outgoing.emit("entity_created", {
      id: newMesh.name,
      components: {
        serialized_mesh: {},
        transform: { position: arrayReduceSigFigs(newMesh.position.asArray()) },
      },
    });
    return newMesh;
  }

  subtract(meshA: BABYLON.Mesh, meshB: BABYLON.Mesh) {
    const csgA = BABYLON.CSG.FromMesh(meshA);
    const csgB = BABYLON.CSG.FromMesh(meshB);
    const csgDiff = csgA.subtract(csgB);
    const newMesh = csgDiff.toMesh(
      `subtract_${random_id(5)}`,
      null,
      this.context.scene,
      false
    );
    // const center = newMesh.getBoundingInfo().boundingBox.center;
    // newMesh.position.subtractInPlace(center);
    // newMesh.bakeCurrentTransformIntoVertices();
    // newMesh.position = center;
    const serializedMesh = BABYLON.SceneSerializer.SerializeMesh(newMesh);
    this.context.channel.push("save_serialized_mesh", {
      entity_id: newMesh.name,
      data: serializedMesh,
    });
    this.context.signalHub.outgoing.emit("entities_deleted", {
      ids: [meshA.name, meshB.name],
    });
    this.context.signalHub.outgoing.emit("entity_created", {
      id: newMesh.name,
      components: {
        serialized_mesh: {},
        transform: { position: arrayReduceSigFigs(newMesh.position.asArray()) },
      },
    });
    return newMesh;
  }

  merge(meshes: BABYLON.Mesh[]) {
    const meshNamesToDelete = Array.from(meshes).map((mesh) => mesh.name);
    const newMesh = BABYLON.Mesh.MergeMeshes(Array.from(meshes), true);
    newMesh.name = `merged_${random_id(5)}`;
    const center = newMesh.getBoundingInfo().boundingBox.center;
    newMesh.position.subtractInPlace(center);
    newMesh.bakeCurrentTransformIntoVertices();
    newMesh.position = center;
    const serializedMesh = BABYLON.SceneSerializer.SerializeMesh(newMesh);
    this.context.channel.push("save_serialized_mesh", {
      entity_id: newMesh.name,
      data: serializedMesh,
    });
    this.context.signalHub.outgoing.emit("entities_deleted", {
      ids: meshNamesToDelete,
    });
    this.context.signalHub.outgoing.emit("entity_created", {
      id: newMesh.name,
      components: {
        serialized_mesh: {},
        transform: { position: arrayReduceSigFigs(newMesh.position.asArray()) },
      },
    });
    return newMesh;
  }

  createMesh(entity_id: string) {
    const mesh = this.context.scene.getMeshByName(entity_id);
    if (mesh) {
      // if we are the client that created the mesh, don't created it twice
      this.meshes[entity_id] = mesh;
      return new Promise((resolve, _reject) => {
        resolve(mesh);
      });
    }

    return new Promise((resolve, _reject) => {
      this.context.channel
        .push("get_serialized_mesh", { entity_id: entity_id })
        .receive("ok", (response) => {
          BABYLON.SceneLoader.ImportMesh(
            "",
            "",
            `data:${JSON.stringify(response)}`,
            this.context.scene
          );
          const importedMesh = this.context.scene.getMeshByName(entity_id);
          this.meshes[entity_id] = importedMesh;
          this.context.signalHub.local.emit("mesh_built", { name: entity_id });
          resolve(importedMesh);
        });
    });
  }

  dispose() {}
}
