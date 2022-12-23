import type { Entity } from "../entity";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";
import * as BABYLON from "babylonjs";
import type { XRS } from "../xrs";

export class SystemText3D extends BaseSystemWithBehaviors implements ISystem {
  name = "text3d";
  order = 1;
  public Writer;
  setup(xrs: XRS) {
    this.xrs = xrs;
    this.Writer = BABYLON["MeshWriter"](this.xrs.context.scene, {
      scale: 0.1,
      defaultFont: "Arial",
      methods: BABYLON,
    });
  }
  buildBehavior() {
    return new BehaviorText(this);
  }
}

export type TextType = { value: string; size?: number };

export class BehaviorText implements IBehavior {
  data: TextType;
  entity: Entity;
  scene: BABYLON.Scene;
  obs: BABYLON.Observer<BABYLON.Scene>;
  mesh: BABYLON.AbstractMesh;
  constructor(public system: SystemText3D) {
    this.scene = system.xrs.context.scene;
  }
  add(entity: Entity, data: TextType) {
    this.entity = entity;
    this.data = data;

    const defaultLetterHeight = 14 * (data.size || 1);

    const sps = new this.system.Writer(data.value, {
      anchor: "center",
      "letter-height": defaultLetterHeight,
      //   color: "#1C3870",
      //   position: {
      //     // z: 0,
      //     // y: 0.1 * defaultLetterHeight,
      //   },
    });
    const mesh: BABYLON.AbstractMesh = sps.getMesh();
    mesh.rotation.x = 4.71239;
    const transform = new BABYLON.TransformNode(this.entity.name);
    transform.rotationQuaternion = new BABYLON.Quaternion();
    mesh.setParent(transform);
    this.entity.transformable = transform;
  }

  update(data: TextType) {
    this.remove();
    this.add(this.entity, data);
    this.entity.refreshAfterModelChanged();
  }
  remove() {
    this.entity.transformable.dispose();
  }
}
