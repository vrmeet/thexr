import type { Context } from "../../context";
import type { Entity } from "../entities/entity";
import type { ISystem } from "./system";
import * as BABYLON from "babylonjs";

export class SystemAvatar implements ISystem {
  name: "avatar";
  public avatars: Record<string, Entity> = {};
  public scene: BABYLON.Scene;
  init(context: Context) {
    this.scene = context.scene;
  }
  dispose() {}
  initEntity(entity: Entity) {
    if (entity.componentObj.avatar) {
      this.buildAvatar(entity, entity.name);
    }
  }
  buildAvatar(entity: Entity, member_id: string) {
    if (this.avatars[member_id]) {
      return;
    }
    entity.transformNode = new BABYLON.TransformNode(member_id, this.scene);
    const head = this.createHead(member_id);
    head.parent = entity.transformNode;
  }
  createHead(member_id: string) {
    const headName = `avatar_${member_id}_head`;

    const box = BABYLON.MeshBuilder.CreateBox(
      headName,
      { size: 0.3 },
      this.scene
    );
    // box.rotationQuaternion = new BABYLON.Quaternion();
    // box.isPickable = false;
    // box.metadata ||= {};
    // box.metadata["member_id"] = member_id;
    return box;
  }
}
