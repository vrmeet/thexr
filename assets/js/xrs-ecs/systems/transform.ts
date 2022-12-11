import * as BABYLON from "babylonjs";
import { arrayReduceSigFigs } from "../../utils/misc";

import type { Context } from "../context";
import type { Entity } from "../entity";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";
import type { XRS } from "../xrs";

type TransformType = {
  position?: number[];
  rotation?: number[];
  scaling?: number[];
  parent?: string;
};

export class SystemTransform
  extends BaseSystemWithBehaviors
  implements ISystem
{
  public name = "transform";
  public scene: BABYLON.Scene;
  public context: Context;
  public gizmoManager: BABYLON.GizmoManager;
  public lastPickedMesh: BABYLON.AbstractMesh;
  public xrs: XRS;
  enableGizmoManager() {
    this.gizmoManager = new BABYLON.GizmoManager(this.scene);
    this.gizmoManager.positionGizmoEnabled = true;
    this.gizmoManager.rotationGizmoEnabled = true;
    this.gizmoManager.gizmos.positionGizmo.scaleRatio = 2;
    this.gizmoManager.gizmos.rotationGizmo.scaleRatio = 1.5;
    this.gizmoManager.scaleGizmoEnabled = true;
    this.gizmoManager.usePointerToAttachGizmos = false;
    if (
      this.lastPickedMesh &&
      this.xrs.context.entities[this.lastPickedMesh.name]
    ) {
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

  setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
    this.scene = xrs.context.scene;
  }

  buildBehavior(): IBehavior {
    return new BehaviorTransform(this);
  }
}

export class BehaviorTransform implements IBehavior {
  data: TransformType;
  entity: Entity;
  constructor(public system: SystemTransform) {}
  add(entity: Entity, data: TransformType): void {
    this.entity = entity;
    this.data = data;
    this.setParenting();
    this.setPosition();
    this.setRotation();
    this.setScaling();
  }
  update(data: TransformType): void {
    Object.assign(this.data, data);
    this.setParenting();
    this.setPosition();
    this.setRotation();
    this.setScaling();
  }
  remove(): void {}

  setPosition() {
    if (this.data.position) {
      this.entity.transformable.position.fromArray(this.data.position);
    }
  }
  setRotation() {
    if (this.data.rotation) {
      if (this.data.rotation.length === 4) {
        this.entity.transformable.rotationQuaternion =
          BABYLON.Quaternion.FromArray(this.data.rotation);
      } else {
        this.entity.transformable.rotationQuaternion =
          BABYLON.Quaternion.FromEulerAngles(
            this.data.rotation[0],
            this.data.rotation[1],
            this.data.rotation[2]
          );
      }
    }
  }
  setScaling() {
    if (this.data.scaling) {
      this.entity.transformable.scaling.fromArray(this.data.scaling);
    }
  }
  setParenting() {
    if (this.data.parent === undefined) {
      return;
    }
    const newParentName = this.data.parent;
    const currentParent = this.entity.transformable?.parent;

    // if your new parent is null, but your current parent is not null
    // then this is an unparent action
    if (newParentName === null && currentParent !== null) {
      // remove the parent, keeping the child at the same world position it was in before
      (this.entity.transformable as BABYLON.AbstractMesh).parent = null;
    } else if (
      newParentName !== null &&
      (currentParent === null || currentParent?.name !== newParentName)
    ) {
      // getting a new parent (either you didn't have one before, or you're switching parents)
      const parent =
        this.system.scene.getTransformNodeByName(this.data.parent) ||
        this.system.scene.getMeshByName(this.data.parent);

      const child = this.entity.transformable as BABYLON.AbstractMesh;
      // parenting fights with imposters, so remove the imposter if this was just thrown
      if (child.physicsImpostor) {
        child.physicsImpostor.dispose();
        child.physicsImpostor = null;
      }
      child.parent = parent;
    }
  }
}
