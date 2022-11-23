import * as BABYLON from "babylonjs";
import type { SignalHub } from "../../signalHub";
import type { PosRot } from "../../types";
import type { Context } from "../context";
import type { Entity } from "../entity";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";
import type { XRS } from "../xrs";

const ANIMATION_FRAME_PER_SECOND = 60;
const TOTAL_ANIMATION_FRAMES = 5;

// position of an avatar should be at the feet

export class SystemAvatar extends BaseSystemWithBehaviors implements ISystem {
  public name = "avatar";
  public scene: BABYLON.Scene;
  public context: Context;
  public signalHub: SignalHub;
  public xrs: XRS;
  init(xrs: XRS) {
    this.context = xrs.context;
    this.signalHub = xrs.context.signalHub;
    this.scene = xrs.context.scene;

    // this.signalHub.incoming.on("about_members").subscribe((members) => {
    //   for (const [member_id, payload] of Object.entries(members.movements)) {
    //     const avatar = this.createAvatar(member_id);
    //     avatar.pose(payload.pos_rot, null, null);
    //   }
    // });

    // this.signalHub.incoming.on("about_space").subscribe((about_space) => {
    //   // move grabbed entities into the hands of avatars
    //   for (const [entity.name, event] of Object.entries(about_space.entities)) {
    //     if (event.m === EventName.entity_grabbed) {
    //       this.findAvatar(event.p.member_id)?.grabEntity(
    //         event.p.hand,
    //         entity.name,
    //         event.p.entity_pos_rot,
    //         event.p.hand_pos_rot
    //       );
    //     } else if (event.m === EventName.entity_released) {
    //       this.findAvatar(event.p.member_id)?.releaseEntity(
    //         event.p.entity.name,
    //         event.p.entity_pos_rot,
    //         event.p.lv,
    //         event.p.av
    //       );
    //     } else if (event.m === EventName.entity_collected) {
    //       const avatar = this.findAvatar(event.p.member_id)?.collectEntity(
    //         event.p.entity.name
    //       );
    //     }
    //   }
    // });

    // this.signalHub.incoming.on("event").subscribe((mpts) => {
    //   if (mpts.m === EventName.member_entered) {
    //     const payload = mpts.p;
    //     const avatar = this.createAvatar(payload.member_id);
    //     avatar.pose(payload.pos_rot, null, null);
    //   } else if (mpts.m === EventName.member_moved) {
    //     const payload = mpts.p;
    //     const avatar = this.createAvatar(payload.member_id);
    //     avatar.pose(payload.pos_rot, payload.left, payload.right);
    //   } else if (mpts.m === EventName.member_left) {
    //     this.deleteAvatar(mpts.p.member_id);
    //   } else if (mpts.m === EventName.member_respawned) {
    //     const payload = mpts.p;
    //     const avatar = this.createAvatar(payload.member_id);
    //     avatar.pose(payload.pos_rot, null, null);
    //   } else if (mpts.m === EventName.entity_grabbed) {
    //     this.findAvatar(mpts.p.member_id).grabEntity(
    //       mpts.p.hand,
    //       mpts.p.entity.name,
    //       mpts.p.entity_pos_rot,
    //       mpts.p.hand_pos_rot
    //     );
    //   } else if (mpts.m === EventName.entity_released) {
    //     this.findAvatar(mpts.p.member_id).releaseEntity(
    //       mpts.p.entity.name,
    //       mpts.p.entity_pos_rot,
    //       mpts.p.lv,
    //       mpts.p.av
    //     );
    //   } else if (mpts.m === EventName.entity_collected) {
    //     this.findAvatar(mpts.p.member_id).collectEntity(mpts.p.entity.name);
    //   }
    // });
  }
  buildBehavior(): IBehavior {
    return new BehaviorAvatar(this);
  }

  //   countAvatars() {
  //     return Object.keys(this.avatars).length;
  //   }

  //   findAvatar(member_id: string) {
  //     return this.avatars[member_id];
  //   }

  //   deleteAvatar(member_id: string) {
  //     if (!this.avatars[member_id]) {
  //       return;
  //     }
  //     this.avatars[member_id].dispose();
  //     delete this.avatars[member_id];
  //   }

  //   registerEntity(entity.name: string, components: ComponentObj) {
  //     if (components.avatar) {
  //       if (!this.avatars[entity.name]) {
  //         this.avatars[entity.name] = new Avatar(
  //           entity.name,
  //           components,
  //           this.context
  //         );
  //       }
  //     }
  //   }

  //   deregisterEntity(entity.name: string): void {
  //     if (this.avatars[entity.name] !== undefined) {
  //       this.avatars[entity.name].dispose();
  //       delete this.avatars[entity.name];
  //     }
  //   }

  //   upsertComponents(entity.name: string, components: ComponentObj): void {
  //     if (
  //       components.avatar !== undefined &&
  //       this.avatars[entity.name] !== undefined
  //     ) {
  //       const avatar = this.avatars[entity.name];
  //       if (entity.name !== this.context.my_member_id) {
  //         // we can ignore updates for own avatar since we are the source of messages
  //         avatar.pose(components.avatar);
  //       }
  //     }
  //   }
}

type AvatarType = {
  head: PosRot;
  left?: PosRot | null;
  right?: PosRot | null;
};

class BehaviorAvatar implements IBehavior {
  public height: number; // actual height of user

  public headTransform: BABYLON.TransformNode;
  public leftTransform: BABYLON.TransformNode;
  public rightTransform: BABYLON.TransformNode;

  public headMesh: BABYLON.AbstractMesh;
  public rightHandMesh: BABYLON.AbstractMesh;
  public leftHandMesh: BABYLON.AbstractMesh;

  public signalHub: SignalHub;
  public scene: BABYLON.Scene;
  public entity: Entity;
  public data: any;
  public context: Context;
  constructor(public system: SystemAvatar) {
    this.context = this.system.context;
    this.scene = this.system.context.scene;
    this.signalHub = this.system.context.signalHub;
    this.height = 1.6;
  }

  add(entity: Entity, data: AvatarType): void {
    this.entity = entity;
    this.data = data;
    this.findOrCreateAvatarHead();

    this.findOrCreateAvatarHand("left");
    this.setHandRaisedPosition(this.leftTransform, "left");

    this.findOrCreateAvatarHand("right");
    this.setHandRaisedPosition(this.rightTransform, "right");
    if (entity.name !== this.context.my_member_id) {
      this.pose();
    }
  }

  update(data: AvatarType): void {
    this.data = data;
    if (this.entity.name !== this.context.my_member_id) {
      this.pose();
    }
  }
  remove(): void {
    this.dispose();
  }

  dispose() {
    this.headTransform.dispose();
    this.leftTransform.dispose();
    this.rightTransform.dispose();
    this.headMesh.dispose();
    this.leftHandMesh.dispose();
    this.rightHandMesh.dispose();
  }

  poseMeshUsingPosRot(node: BABYLON.TransformNode, posRot: PosRot) {
    if (!node) {
      return;
    }
    // if we're getting a hand position, then free the hand from the face
    if (node.parent) {
      node.setParent(null);
    }

    // this.animatables.push(
    //   this.context.BABYLON.Animation.CreateAndStartAnimation(
    //     "",
    //     mesh,
    //     "position",
    //     ANIMATION_FRAME_PER_SECOND,
    //     TOTAL_ANIMATION_FRAMES,
    //     mesh.position,
    //     this.context.BABYLON.Vector3.FromArray(pose.pos),
    //     this.context.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    //   )
    // );
    node.position.fromArray(posRot.pos);

    let newQuaternion;
    if (posRot.rot.length === 4) {
      newQuaternion = this.context.BABYLON.Quaternion.FromArray(posRot.rot);
    } else if (posRot.rot.length === 3) {
      newQuaternion = this.context.BABYLON.Quaternion.FromEulerAngles(
        posRot.rot[0],
        posRot.rot[1],
        posRot.rot[2]
      );
    }
    node.rotationQuaternion = newQuaternion;
    // this.animatables.push(
    //   this.context.BABYLON.Animation.CreateAndStartAnimation(
    //     "",
    //     mesh,
    //     "rotationQuaternion",
    //     ANIMATION_FRAME_PER_SECOND,
    //     TOTAL_ANIMATION_FRAMES,
    //     mesh.rotationQuaternion,
    //     newQuaternion,
    //     this.context.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    //   )
    // );
  }

  setHandRaisedPosition(handTransform: BABYLON.TransformNode, hand: string) {
    if (handTransform.parent) {
      return;
    }
    let offset;
    if (hand[0] === "l") {
      offset = [-0.2, 0, 0.2];
    } else {
      offset = [0.2, 0, 0.2];
    }
    // first parent to head so that our adjustments on local space...
    if (this.entity.name != this.context.my_member_id) {
      handTransform.parent = this.headTransform;
    } else {
      handTransform.parent = this.scene.activeCamera;
    }
    handTransform.rotationQuaternion.copyFromFloats(0, 0, 0, 1);
    handTransform.position.copyFromFloats(offset[0], offset[1], offset[2]);
  }

  pose() {
    // this.stopPreviousAnimations();
    // this.poseMeshUsingPosRot(this.head, avatarComponent.head);
    this.signalHub.service.emit("animate_translate", {
      target: this.headTransform,
      from: this.headTransform.position,
      to: this.data.head.pos,
      duration: 100,
    });
    this.signalHub.service.emit("animate_rotation", {
      target: this.headTransform,
      from: this.headTransform.rotationQuaternion,
      to: this.data.head.rot,
      duration: 100,
    });

    if (this.data.left) {
      this.poseMeshUsingPosRot(this.leftTransform, this.data.left);
    } else {
      this.setHandRaisedPosition(this.leftTransform, "left");
    }
    if (this.data.right) {
      this.poseMeshUsingPosRot(this.rightTransform, this.data.right);
    } else {
      this.setHandRaisedPosition(this.rightTransform, "right");
    }
  }

  findOrCreateAvatarHead() {
    const headTransformName = `${this.entity.name}_avatar_head_transform`;
    const headName = `${this.entity.name}_avatar_head`;
    this.headTransform = this.scene.getTransformNodeByName(headTransformName);
    if (!this.headTransform) {
      this.headTransform = new BABYLON.TransformNode(
        headTransformName,
        this.scene
      );
      this.headTransform.rotationQuaternion =
        new this.context.BABYLON.Quaternion();

      const box = this.context.BABYLON.MeshBuilder.CreateBox(
        headName,
        { size: 0.3 },
        this.scene
      );
      box.isPickable = false;
      // box.metadata ||= {};
      // box.metadata["member_id"] = member_id;
      // BABYLON.Tags.AddTagsTo(box, "avatar");
      box.visibility = 0.5;
      if (this.entity.name === this.context.my_member_id) {
        // don't draw my own head, it gets in the way

        box.setEnabled(false);
      }
      this.headMesh = box;
      this.headMesh.parent = this.headTransform;
    }
  }

  findOrCreateAvatarHand(hand: string) {
    const transformName = `${this.entity.name}_avatar_${hand}_transform`;
    const meshName = `${this.entity.name}_avatar_${hand}`;
    let transform = this.scene.getTransformNodeByName(transformName);
    if (!transform) {
      transform = new BABYLON.TransformNode(transformName, this.scene);
      transform.rotationQuaternion = new this.context.BABYLON.Quaternion();
      this[`${hand}Transform`] = transform;
      const mesh = this.context.BABYLON.MeshBuilder.CreateBox(
        meshName,
        { width: 0.053, height: 0.08, depth: 0.1 },
        this.scene
      );

      mesh.isPickable = false;
      mesh.visibility = 0.5;
      this[`${hand}HandMesh`] = mesh;
      mesh.parent = transform;
    }
  }
}
