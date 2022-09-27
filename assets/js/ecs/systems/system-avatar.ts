import type { Context } from "../../context";
import type { ISystem } from "../system";
import type * as BABYLON from "babylonjs";
import type { SignalHub } from "../../signalHub";
import type { ComponentObj } from "../components/component-obj";
import type { PosRot } from "../../types";

const ANIMATION_FRAME_PER_SECOND = 60;
const TOTAL_ANIMATION_FRAMES = 5;

class Avatar {
  public mode: "LAYING" | "STANDING" | "SITTING"; // useful for aiding body estimate
  public height: number; // actual height of user
  public head: BABYLON.AbstractMesh;
  public rightHand: BABYLON.AbstractMesh;
  public leftHand: BABYLON.AbstractMesh;

  public debug: boolean;
  public animatables: BABYLON.Animatable[];

  public debugHead: BABYLON.AbstractMesh;
  public debugLeftHand: BABYLON.AbstractMesh;
  public debugRightHand: BABYLON.AbstractMesh;
  public member_id: string;
  public transform: BABYLON.TransformNode;
  public signalHub: SignalHub;
  public scene: BABYLON.Scene;
  constructor(
    public entity_id: string,
    public context: Context,
    createhead = true
  ) {
    this.scene = this.context.scene;
    this.signalHub = this.context.signalHub;
    this.transform = new this.context.BABYLON.TransformNode(
      entity_id,
      this.scene
    );
    this.member_id = entity_id;
    this.mode = "STANDING";
    this.animatables = [];
    this.debug = false;
    this.height = 1.6;
    if (createhead) {
      this.head = this.findOrCreateAvatarHead(this.member_id, this.scene);
      this.head.position.y = this.height;
      this.head.setParent(this.transform);
    }
    this.leftHand = this.findOrCreateAvatarHand(
      this.member_id,
      "left",
      this.scene
    );
    this.rightHand = this.findOrCreateAvatarHand(
      this.member_id,
      "right",
      this.scene
    );
    this.setHandRaisedPosition(this.leftHand, "left");
    this.setHandRaisedPosition(this.rightHand, "right");
    // create debug spheres
    if (this.debug) {
      this.debugHead = this.context.BABYLON.MeshBuilder.CreateSphere(
        "",
        { diameter: 0.2 },
        this.scene
      );
      this.debugLeftHand = this.context.BABYLON.MeshBuilder.CreateSphere(
        "",
        { diameter: 0.2 },
        this.scene
      );
      this.debugRightHand = this.context.BABYLON.MeshBuilder.CreateSphere(
        "",
        { diameter: 0.2 },
        this.scene
      );
    }
  }

  dispose() {
    this.head.dispose();
    this.leftHand.dispose();
    this.rightHand.dispose();
  }

  poseMeshUsingPosRot(mesh: BABYLON.AbstractMesh, pose: PosRot) {
    if (!mesh) {
      return;
    }
    // if we're getting a hand position, then free the hand from the face
    if (mesh.parent) {
      mesh.setParent(null);
    }

    this.animatables.push(
      this.context.BABYLON.Animation.CreateAndStartAnimation(
        "",
        mesh,
        "position",
        ANIMATION_FRAME_PER_SECOND,
        TOTAL_ANIMATION_FRAMES,
        mesh.position,
        this.context.BABYLON.Vector3.FromArray(pose.pos),
        this.context.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      )
    );

    let newQuaternion;
    if (pose.rot.length === 4) {
      newQuaternion = this.context.BABYLON.Quaternion.FromArray(pose.rot);
    } else if (pose.rot.length === 3) {
      newQuaternion = this.context.BABYLON.Quaternion.FromEulerAngles(
        pose.rot[0],
        pose.rot[1],
        pose.rot[2]
      );
    }
    this.animatables.push(
      this.context.BABYLON.Animation.CreateAndStartAnimation(
        "",
        mesh,
        "rotationQuaternion",
        ANIMATION_FRAME_PER_SECOND,
        TOTAL_ANIMATION_FRAMES,
        mesh.rotationQuaternion,
        newQuaternion,
        this.context.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      )
    );
  }

  setHandRaisedPosition(handMesh: BABYLON.AbstractMesh, hand: string) {
    if (handMesh.parent) {
      return;
    }
    Avatar.setHandRaisedPosition(this.head, handMesh, hand);
    handMesh.setParent(this.head);
  }

  static setHandRaisedPosition(
    headNode: BABYLON.TransformNode,
    handMesh: BABYLON.AbstractMesh,
    hand: string
  ) {
    let offset;
    if (hand[0] === "l") {
      offset = [-0.2, 0, 0.2];
    } else {
      offset = [0.2, 0, 0.2];
    }
    handMesh.parent = headNode;
    handMesh.rotationQuaternion.copyFromFloats(0, 0, 0, 1);
    handMesh.position.copyFromFloats(offset[0], offset[1], offset[2]);
    handMesh.setParent(null);
  }

  stopPreviousAnimations() {
    this.animatables.forEach((a) => {
      a.stop();
    });
    this.animatables = [];
  }

  pose(headPose: PosRot, leftPose: PosRot | null, rightPose: PosRot | null) {
    if (this.debug) {
      this.debugHead.position = this.context.BABYLON.Vector3.FromArray(
        headPose.pos
      );
      if (leftPose) {
        this.debugLeftHand.position = this.context.BABYLON.Vector3.FromArray(
          leftPose.pos
        );
      }
      if (rightPose) {
        this.debugRightHand.position = this.context.BABYLON.Vector3.FromArray(
          rightPose.pos
        );
      }
    }

    // this.stopPreviousAnimations();
    if (this.head) {
      this.poseMeshUsingPosRot(this.head, headPose);
    } else {
      // for use in resetting the position after respawn

      // TODO, if in XR, maybe just teleport to this point
      const cam = this.scene.activeCamera as BABYLON.FreeCamera;
      cam.position.copyFromFloats(
        headPose.pos[0],
        headPose.pos[1],
        headPose.pos[2]
      );
      cam.rotationQuaternion = this.context.BABYLON.Quaternion.FromArray(
        headPose.rot
      );
    }
    if (leftPose) {
      this.poseMeshUsingPosRot(this.leftHand, leftPose);
    } else {
      this.setHandRaisedPosition(this.leftHand, "left");
    }
    if (rightPose) {
      this.poseMeshUsingPosRot(this.rightHand, rightPose);
    } else {
      this.setHandRaisedPosition(this.rightHand, "right");
    }
  }

  findAvatarHead(member_id: string) {
    const headName = `avatar_${member_id}_head`;
    return this.scene.getMeshByName(headName);
  }

  findOrCreateAvatarHead(member_id: string, scene: BABYLON.Scene) {
    const headName = `avatar_${member_id}_head`;
    const head = this.findAvatarHead(member_id);
    if (head) {
      return head;
    }
    const box = this.context.BABYLON.MeshBuilder.CreateBox(
      headName,
      { size: 0.3 },
      scene
    );
    // box.rotationQuaternion = new BABYLON.Quaternion();
    // box.isPickable = false;
    // box.metadata ||= {};
    // box.metadata["member_id"] = member_id;
    // BABYLON.Tags.AddTagsTo(box, "avatar");
    // box.visibility = 0.5;
    return box;
  }

  findAvatarHand(member_id: string, hand: string) {
    const meshName = `avatar_${member_id}_${hand}`;
    return this.scene.getMeshByName(meshName);
  }

  findOrCreateAvatarHand(
    member_id: string,
    hand: string,
    scene: BABYLON.Scene
  ) {
    const meshName = `avatar_${member_id}_${hand}`;
    let mesh = this.findAvatarHand(member_id, hand);
    if (mesh) {
      return mesh;
    }
    mesh = this.context.BABYLON.MeshBuilder.CreateBox(
      meshName,
      { width: 0.053, height: 0.08, depth: 0.1 },
      scene
    );
    mesh.rotationQuaternion = new this.context.BABYLON.Quaternion();
    mesh.isPickable = false;
    return mesh;
  }
}

// position of an avatar should be at the feet

class SystemAvatar implements ISystem {
  public name = "system-avatar";
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

    this.signalHub.incoming.on("component_upserted").subscribe((msg) => {
      const avatar = this.avatars[msg.id];
      if (avatar) {
        avatar.pose(msg.data.head, msg.data.left, msg.data.right);
      }
    });

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
  initEntity(entity_id: string, components: ComponentObj) {
    if (components.avatar) {
      if (!this.avatars[entity_id]) {
        this.avatars[entity_id] = new Avatar(entity_id, this.context);
      }
    }
  }
}
window["system-avatar"] = new SystemAvatar();
