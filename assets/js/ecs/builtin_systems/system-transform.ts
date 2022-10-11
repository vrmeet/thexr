import type * as BABYLON from "babylonjs";

import type { Context } from "../../context";
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
  init(context: Context) {
    this.scene = context.scene;
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
      console.log("transform will UNparent", this.transforms[entity_id].name);
      (this.transforms[entity_id] as BABYLON.AbstractMesh).parent = null; // because pos,rot,scale are already in world positions
    } else if (
      newParentName !== null &&
      (currentParent === null || currentParent?.name !== newParentName)
    ) {
      if (this.transforms[entity_id])
        console.log(
          "transform will parent",
          this.transforms[entity_id].name,
          "to",
          components.transform.parent
        );
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
