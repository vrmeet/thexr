import type { Context } from "../../context";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";
import { arrayReduceSigFigs, random_id } from "../../utils/misc";

export class SystemSerializedMesh implements ISystem {
  public entityMeshes: Record<string, BABYLON.AbstractMesh> = {};
  public importedMeshes: Record<string, BABYLON.AbstractMesh> = {};
  public name = "serialized_mesh";
  public order = 0;
  public context: Context;
  init(context: Context) {
    this.context = context;
  }

  async registerEntity(entity_id: string, components: ComponentObj) {
    if (components.serialized_mesh) {
      if (!this.entityMeshes[entity_id]) {
        const mesh_id = components.serialized_mesh.mesh_id;
        // if we are the ones that serialized mesh locally, no need to process this event
        const mesh = this.context.scene.getMeshByName(mesh_id);
        if (mesh) {
          if (entity_id === mesh_id) {
            this.entityMeshes[entity_id] = mesh;
            this.importedMeshes[mesh_id] = mesh;
            return; // we're probably done
          }
        }
        // else, we are another client, so load the serialization
        this.entityMeshes[entity_id] = await this.createMesh(
          entity_id,
          mesh_id
        );
      }
    }
  }

  async upsertComponents(entity_id: string, components: ComponentObj) {
    if (
      components.serialized_mesh !== undefined &&
      this.entityMeshes[entity_id] !== undefined
    ) {
      // recreate the mesh
      this.entityMeshes[entity_id].dispose();
      this.entityMeshes[entity_id] = await this.createMesh(
        entity_id,
        components.serialized_mesh.mesh_id
      );
    }
  }

  deregisterEntity(entity_id: string) {
    if (this.entityMeshes[entity_id] !== undefined) {
      this.entityMeshes[entity_id].dispose();
      delete this.entityMeshes[entity_id];
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
    this.emitReplacementEvents(newMesh.name, newMesh, [meshA.name, meshB.name]);
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
    this.emitReplacementEvents(newMesh.name, newMesh, [meshA.name, meshB.name]);
    return newMesh;
  }

  emitReplacementEvents(
    newEntityId: string,
    newMesh: BABYLON.AbstractMesh,
    oldMeshIds: string[]
  ) {
    const serializedMesh = BABYLON.SceneSerializer.SerializeMesh(newMesh);
    this.context.channel.push("save_serialized_mesh", {
      mesh_id: newMesh.name,
      data: serializedMesh,
    });
    this.context.signalHub.outgoing.emit("entity_created", {
      id: newEntityId,
      components: {
        serialized_mesh: { mesh_id: newMesh.name },
        transform: { position: arrayReduceSigFigs(newMesh.position.asArray()) },
      },
    });
    this.context.signalHub.outgoing.emit("entities_deleted", {
      ids: oldMeshIds,
    });
  }

  merge(meshes: BABYLON.Mesh[]) {
    const meshNamesToDelete = Array.from(meshes).map((mesh) => mesh.name);
    const newMesh = BABYLON.Mesh.MergeMeshes(Array.from(meshes), true);
    newMesh.name = `merged_${random_id(5)}`;
    const center = newMesh.getBoundingInfo().boundingBox.center;
    newMesh.position.subtractInPlace(center);
    newMesh.bakeCurrentTransformIntoVertices();
    newMesh.position = center;
    this.emitReplacementEvents(newMesh.name, newMesh, meshNamesToDelete);
    return newMesh;
  }

  // loads json data into a new mesh into the scene
  asyncLoadMesh(mesh_id: string): Promise<BABYLON.AbstractMesh> {
    return new Promise((resolve, _reject) => {
      this.context.channel
        .push("get_serialized_mesh", { mesh_id: mesh_id })
        .receive("ok", (response) => {
          BABYLON.SceneLoader.ImportMesh(
            "",
            "",
            `data:${JSON.stringify(response)}`,
            this.context.scene
          );
          const importedMesh = this.context.scene.getMeshByName(mesh_id);
          resolve(importedMesh);
        });
    });
  }

  async createMesh(
    entity_id: string,
    mesh_id: string
  ): Promise<BABYLON.AbstractMesh> {
    let newMesh;

    if (!this.importedMeshes[mesh_id]) {
      newMesh = await this.asyncLoadMesh(mesh_id);
      this.importedMeshes[mesh_id] = newMesh;
      newMesh.name = entity_id;
      return newMesh;
    } else {
      // you might be duplicating an existing mesh
      return this.importedMeshes[mesh_id].clone(entity_id, null);
    }
  }

  dispose() {}
}
