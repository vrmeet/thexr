import * as BABYLON from "babylonjs";

import type { Context } from "../../context";
import { arrayReduceSigFigs } from "../../utils/misc";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";

interface ITransformable {
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
  scaling: BABYLON.Vector3;
  parent: BABYLON.Node;
  name: string;
}

export class SystemTransform implements ISystem {
  public transforms: { [entity_id: string]: ITransformable } = {};
  public name = "transform";
  public order = 3;
  public scene: BABYLON.Scene;
  public context: Context;
  public gizmoManager: BABYLON.GizmoManager;
  public lastPickedMesh: BABYLON.AbstractMesh;

  enableGizmoManager() {
    this.gizmoManager = new BABYLON.GizmoManager(this.scene);
    this.gizmoManager.positionGizmoEnabled = true;
    this.gizmoManager.rotationGizmoEnabled = true;
    this.gizmoManager.gizmos.positionGizmo.scaleRatio = 2;
    this.gizmoManager.gizmos.rotationGizmo.scaleRatio = 1.5;
    this.gizmoManager.scaleGizmoEnabled = true;
    this.gizmoManager.usePointerToAttachGizmos = false;
    if (this.lastPickedMesh && this.context.state[this.lastPickedMesh.name]) {
      this.gizmoManagerAttachMesh(this.lastPickedMesh);
    }
    this.gizmoManager.gizmos.positionGizmo.onDragEndObservable.add(
      (_data, _state) => {
        this.broadcastNewPosition();
      }
    );

    this.gizmoManager.gizmos.rotationGizmo.onDragEndObservable.add(
      (_data, _state) => {
        this.broadcastNewRotation();
      }
    );

    this.gizmoManager.gizmos.scaleGizmo.onDragEndObservable.add(
      (_data, _state) => {
        this.broadcastNewScale();
      }
    );
  }

  gizmoManagerAttachMesh(mesh: BABYLON.AbstractMesh) {
    this.lastPickedMesh = mesh;
    this.gizmoManager.attachToMesh(mesh);
  }

  broadcastNewPosition = () => {
    this.context.signalHub.outgoing.emit("components_upserted", {
      id: this.lastPickedMesh.name,
      components: {
        transform: {
          position: arrayReduceSigFigs(this.lastPickedMesh.position.asArray()),
        },
      },
    });
  };

  broadcastNewRotation = () => {
    this.context.signalHub.outgoing.emit("components_upserted", {
      id: this.lastPickedMesh.name,
      components: {
        transform: {
          rotation: arrayReduceSigFigs(this.lastPickedMesh.rotation.asArray()),
        },
      },
    });
  };

  broadcastNewScale = () => {
    this.context.signalHub.outgoing.emit("components_upserted", {
      id: this.lastPickedMesh.name,
      components: {
        transform: {
          scaling: arrayReduceSigFigs(this.lastPickedMesh.scaling.asArray()),
        },
      },
    });
  };

  disableGizmoManager() {
    this.gizmoManager.dispose();
    this.gizmoManager = null;
  }

  init(context: Context) {
    this.context = context;
    this.scene = context.scene;
    // context.signalHub.local.on("mesh_built").subscribe((payload) => {
    //   if (
    //     context.state[payload.name] &&
    //     context.state[payload.name].transform !== undefined
    //   ) {
    //     this.registerEntity(payload.name, context.state[payload.name]);
    //   }
    // });
  }
  upsertComponents(entity_id: string, components: ComponentObj): void {
    this.registerEntity(entity_id, components);
  }
  deregisterEntity(entity_id: string): void {
    delete this.transforms[entity_id];
  }
  registerEntity(entity_id: string, components: ComponentObj) {
    if (components.transform === undefined) {
      return;
    }
    const mesh = this.scene.getMeshByName(entity_id);

    if (mesh) {
      this.transforms[entity_id] = mesh;
    } else {
      // if this isn't a mesh, maybe it's a transform node, like for a character model
      const transformNode = this.scene.getTransformNodeByName(entity_id);
      if (transformNode) {
        this.transforms[entity_id] = transformNode;
      }
    }
    if (!this.transforms[entity_id]) {
      return;
    }
    this.setPosition(entity_id, components);
    this.setRotation(entity_id, components);
    this.setScaling(entity_id, components);
    this.setParenting(entity_id, components);
  }

  setParenting(entity_id: string, components: ComponentObj) {
    if (components.transform.parent === undefined) {
      return;
    }
    const newParentName = components.transform.parent;
    const currentParent = this.transforms[entity_id].parent;

    if (newParentName === null && currentParent !== null) {
      (this.transforms[entity_id] as BABYLON.AbstractMesh).parent = null; // because pos,rot,scale are already in world positions
    } else if (
      newParentName !== null &&
      (currentParent === null || currentParent?.name !== newParentName)
    ) {
      const parent =
        this.scene.getTransformNodeByName(components.transform.parent) ||
        this.scene.getMeshByName(components.transform.parent);

      const child = this.transforms[entity_id] as BABYLON.AbstractMesh;
      // parenting fights with imposters, so remove the imposter if this was just thrown
      if (child.physicsImpostor) {
        child.physicsImpostor.dispose();
        child.physicsImpostor = null;
      }
      child.parent = parent;
    }
  }

  setPosition(entity_id: string, components: ComponentObj) {
    if (components.transform.position) {
      this.transforms[entity_id].position.fromArray(
        components.transform.position
      );
    }
  }
  setRotation(entity_id: string, components: ComponentObj) {
    if (components.transform.rotation) {
      this.transforms[entity_id].rotation.fromArray(
        components.transform.rotation
      );
    }
  }
  setScaling(entity_id: string, components: ComponentObj) {
    if (components.transform.scaling) {
      this.transforms[entity_id].scaling.fromArray(
        components.transform.scaling
      );
    }
  }
  dispose() {}
}
