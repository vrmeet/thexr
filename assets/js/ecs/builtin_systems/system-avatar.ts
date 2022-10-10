import type { Context } from "../../context";

import type * as BABYLON from "babylonjs";
import type { SignalHub } from "../../signalHub";
import type { ComponentObj } from "../components/component-obj";
import type { PosRot } from "../../types";
import type { ISystem } from "./isystem";

const ANIMATION_FRAME_PER_SECOND = 60;
const TOTAL_ANIMATION_FRAMES = 5;

class Avatar {
  public height: number; // actual height of user
  public head: BABYLON.AbstractMesh;
  public rightHand: BABYLON.AbstractMesh;
  public leftHand: BABYLON.AbstractMesh;

  public animatables: BABYLON.Animatable[];
  public signalHub: SignalHub;
  public scene: BABYLON.Scene;
  constructor(
    public entity_id: string,
    public components: ComponentObj,
    public context: Context
  ) {
    this.scene = this.context.scene;
    this.signalHub = this.context.signalHub;
    this.animatables = [];
    this.height = 1.6;
    this.head = this.findOrCreateAvatarHead();
    this.head.position.y = this.height;
    this.leftHand = this.findOrCreateAvatarHand("left");
    this.rightHand = this.findOrCreateAvatarHand("right");
    this.setHandRaisedPosition(this.leftHand, "left");
    this.setHandRaisedPosition(this.rightHand, "right");
    if (this.entity_id !== this.context.my_member_id) {
      this.pose(components.avatar);
    }
  }

  dispose() {
    this.head.dispose();
    this.leftHand.dispose();
    this.rightHand.dispose();
  }

  poseMeshUsingPosRot(mesh: BABYLON.AbstractMesh, posRot: PosRot) {
    if (!mesh) {
      return;
    }
    // if we're getting a hand position, then free the hand from the face
    if (mesh.parent) {
      mesh.setParent(null);
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
    mesh.position.fromArray(posRot.pos);

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
    mesh.rotationQuaternion = newQuaternion;
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

  setHandRaisedPosition(handMesh: BABYLON.AbstractMesh, hand: string) {
    if (handMesh.parent) {
      return;
    }
    let offset;
    if (hand[0] === "l") {
      offset = [-0.2, 0, 0.2];
    } else {
      offset = [0.2, 0, 0.2];
    }
    // first parent to head so that our adjustments on local space...
    if (this.entity_id != this.context.my_member_id) {
      handMesh.parent = this.head;
    } else {
      handMesh.parent = this.scene.activeCamera;
    }
    handMesh.rotationQuaternion.copyFromFloats(0, 0, 0, 1);
    handMesh.position.copyFromFloats(offset[0], offset[1], offset[2]);
  }

  stopPreviousAnimations() {
    this.animatables.forEach((a) => {
      a.stop();
    });
    this.animatables = [];
  }

  pose(avatarComponent: {
    head: PosRot;
    left?: PosRot | null;
    right?: PosRot | null;
  }) {
    // this.stopPreviousAnimations();
    // this.poseMeshUsingPosRot(this.head, avatarComponent.head);
    this.signalHub.service.emit("animate_translate", {
      target: this.head,
      from: this.head.position,
      to: avatarComponent.head.pos,
      duration: 100,
    });
    this.signalHub.service.emit("animate_rotation", {
      target: this.head,
      from: this.head.rotationQuaternion,
      to: avatarComponent.head.rot,
      duration: 100,
    });

    if (avatarComponent.left) {
      this.poseMeshUsingPosRot(this.leftHand, avatarComponent.left);
    } else {
      this.setHandRaisedPosition(this.leftHand, "left");
    }
    if (avatarComponent.right) {
      this.poseMeshUsingPosRot(this.rightHand, avatarComponent.right);
    } else {
      this.setHandRaisedPosition(this.rightHand, "right");
    }
  }

  findAvatarHead() {
    const headName = `avatar_${this.entity_id}_head`;
    return this.scene.getMeshByName(headName);
  }

  findOrCreateAvatarHead() {
    const headName = `avatar_${this.entity_id}_head`;
    const head = this.findAvatarHead();
    if (head) {
      return head;
    }
    const box = this.context.BABYLON.MeshBuilder.CreateBox(
      headName,
      { size: 0.3 },
      this.scene
    );
    box.rotationQuaternion = new this.context.BABYLON.Quaternion();
    box.isPickable = false;
    // box.metadata ||= {};
    // box.metadata["member_id"] = member_id;
    // BABYLON.Tags.AddTagsTo(box, "avatar");
    box.visibility = 0.5;
    if (this.entity_id === this.context.my_member_id) {
      // don't draw my own head, it gets in the way

      box.setEnabled(false);
    }
    return box;
  }

  findAvatarHand(hand: string) {
    const meshName = `avatar_${this.entity_id}_${hand}`;
    return this.scene.getMeshByName(meshName);
  }

  findOrCreateAvatarHand(hand: string) {
    const meshName = `avatar_${this.entity_id}_${hand}`;
    let mesh = this.findAvatarHand(hand);
    if (mesh) {
      return mesh;
    }
    mesh = this.context.BABYLON.MeshBuilder.CreateBox(
      meshName,
      { width: 0.053, height: 0.08, depth: 0.1 },
      this.scene
    );
    mesh.rotationQuaternion = new this.context.BABYLON.Quaternion();
    mesh.isPickable = false;
    mesh.visibility = 0.5;
    return mesh;
  }
}

// position of an avatar should be at the feet

export class SystemAvatar implements ISystem {
  public name = "avatar";
  public order = 1;
  public avatars: Record<string, Avatar> = {};
  public scene: BABYLON.Scene;
  public context: Context;
  public signalHub: SignalHub;

  init(context: Context) {
    this.context = context;
    this.signalHub = context.signalHub;
    this.scene = context.scene;

    // this.signalHub.incoming.on("about_members").subscribe((members) => {
    //   for (const [member_id, payload] of Object.entries(members.movements)) {
    //     const avatar = this.createAvatar(member_id);
    //     avatar.pose(payload.pos_rot, null, null);
    //   }
    // });

    // this.signalHub.incoming.on("about_space").subscribe((about_space) => {
    //   // move grabbed entities into the hands of avatars
    //   for (const [entity_id, event] of Object.entries(about_space.entities)) {
    //     if (event.m === EventName.entity_grabbed) {
    //       this.findAvatar(event.p.member_id)?.grabEntity(
    //         event.p.hand,
    //         entity_id,
    //         event.p.entity_pos_rot,
    //         event.p.hand_pos_rot
    //       );
    //     } else if (event.m === EventName.entity_released) {
    //       this.findAvatar(event.p.member_id)?.releaseEntity(
    //         event.p.entity_id,
    //         event.p.entity_pos_rot,
    //         event.p.lv,
    //         event.p.av
    //       );
    //     } else if (event.m === EventName.entity_collected) {
    //       const avatar = this.findAvatar(event.p.member_id)?.collectEntity(
    //         event.p.entity_id
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
    //       mpts.p.entity_id,
    //       mpts.p.entity_pos_rot,
    //       mpts.p.hand_pos_rot
    //     );
    //   } else if (mpts.m === EventName.entity_released) {
    //     this.findAvatar(mpts.p.member_id).releaseEntity(
    //       mpts.p.entity_id,
    //       mpts.p.entity_pos_rot,
    //       mpts.p.lv,
    //       mpts.p.av
    //     );
    //   } else if (mpts.m === EventName.entity_collected) {
    //     this.findAvatar(mpts.p.member_id).collectEntity(mpts.p.entity_id);
    //   }
    // });
  }

  countAvatars() {
    return Object.keys(this.avatars).length;
  }

  findAvatar(member_id: string) {
    return this.avatars[member_id];
  }

  deleteAvatar(member_id: string) {
    if (!this.avatars[member_id]) {
      return;
    }
    this.avatars[member_id].dispose();
    delete this.avatars[member_id];
  }

  dispose() {}

  registerEntity(entity_id: string, components: ComponentObj) {
    if (components.avatar) {
      if (!this.avatars[entity_id]) {
        this.avatars[entity_id] = new Avatar(
          entity_id,
          components,
          this.context
        );
      }
    }
  }

  deregisterEntity(entity_id: string): void {
    if (this.avatars[entity_id] !== undefined) {
      this.avatars[entity_id].dispose();
      delete this.avatars[entity_id];
    }
  }

  upsertComponents(entity_id: string, components: ComponentObj): void {
    console.log("reciving upsert in avatar");
    if (
      components.avatar !== undefined &&
      this.avatars[entity_id] !== undefined
    ) {
      const avatar = this.avatars[entity_id];
      if (entity_id !== this.context.my_member_id) {
        // we can ignore updates for own avatar since we are the source of messages
        avatar.pose(components.avatar);
      }
    }
  }
}
