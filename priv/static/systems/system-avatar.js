const ANIMATION_FRAME_PER_SECOND = 60;
const TOTAL_ANIMATION_FRAMES = 5;
class Avatar {
  constructor(entity_id, context, createhead = true) {
    this.entity_id = entity_id;
    this.context = context;
    this.scene = this.context.scene;
    this.signalHub = this.context.signalHub;
    this.transform = new this.context.BABYLON.TransformNode(entity_id, this.scene);
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
    this.leftHand = this.findOrCreateAvatarHand(this.member_id, "left", this.scene);
    this.rightHand = this.findOrCreateAvatarHand(this.member_id, "right", this.scene);
    this.setHandRaisedPosition(this.leftHand, "left");
    this.setHandRaisedPosition(this.rightHand, "right");
    if (this.debug) {
      this.debugHead = this.context.BABYLON.MeshBuilder.CreateSphere("", { diameter: 0.2 }, this.scene);
      this.debugLeftHand = this.context.BABYLON.MeshBuilder.CreateSphere("", { diameter: 0.2 }, this.scene);
      this.debugRightHand = this.context.BABYLON.MeshBuilder.CreateSphere("", { diameter: 0.2 }, this.scene);
    }
  }
  dispose() {
    this.head.dispose();
    this.leftHand.dispose();
    this.rightHand.dispose();
  }
  poseMeshUsingPosRot(mesh, pose) {
    if (!mesh) {
      return;
    }
    if (mesh.parent) {
      mesh.setParent(null);
    }
    this.animatables.push(this.context.BABYLON.Animation.CreateAndStartAnimation("", mesh, "position", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, mesh.position, this.context.BABYLON.Vector3.FromArray(pose.pos), this.context.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT));
    let newQuaternion;
    if (pose.rot.length === 4) {
      newQuaternion = this.context.BABYLON.Quaternion.FromArray(pose.rot);
    } else if (pose.rot.length === 3) {
      newQuaternion = this.context.BABYLON.Quaternion.FromEulerAngles(pose.rot[0], pose.rot[1], pose.rot[2]);
    }
    this.animatables.push(this.context.BABYLON.Animation.CreateAndStartAnimation("", mesh, "rotationQuaternion", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, mesh.rotationQuaternion, newQuaternion, this.context.BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT));
  }
  setHandRaisedPosition(handMesh, hand) {
    if (handMesh.parent) {
      return;
    }
    Avatar.setHandRaisedPosition(this.head, handMesh, hand);
    handMesh.setParent(this.head);
  }
  static setHandRaisedPosition(headNode, handMesh, hand) {
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
  pose(headPose, leftPose, rightPose) {
    if (this.debug) {
      this.debugHead.position = this.context.BABYLON.Vector3.FromArray(headPose.pos);
      if (leftPose) {
        this.debugLeftHand.position = this.context.BABYLON.Vector3.FromArray(leftPose.pos);
      }
      if (rightPose) {
        this.debugRightHand.position = this.context.BABYLON.Vector3.FromArray(rightPose.pos);
      }
    }
    if (this.head) {
      this.poseMeshUsingPosRot(this.head, headPose);
    } else {
      const cam = this.scene.activeCamera;
      cam.position.copyFromFloats(headPose.pos[0], headPose.pos[1], headPose.pos[2]);
      cam.rotationQuaternion = this.context.BABYLON.Quaternion.FromArray(headPose.rot);
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
  findAvatarHead(member_id) {
    const headName = `avatar_${member_id}_head`;
    return this.scene.getMeshByName(headName);
  }
  findOrCreateAvatarHead(member_id, scene) {
    const headName = `avatar_${member_id}_head`;
    const head = this.findAvatarHead(member_id);
    if (head) {
      return head;
    }
    const box = this.context.BABYLON.MeshBuilder.CreateBox(headName, { size: 0.3 }, scene);
    return box;
  }
  findAvatarHand(member_id, hand) {
    const meshName = `avatar_${member_id}_${hand}`;
    return this.scene.getMeshByName(meshName);
  }
  findOrCreateAvatarHand(member_id, hand, scene) {
    const meshName = `avatar_${member_id}_${hand}`;
    let mesh = this.findAvatarHand(member_id, hand);
    if (mesh) {
      return mesh;
    }
    mesh = this.context.BABYLON.MeshBuilder.CreateBox(meshName, { width: 0.053, height: 0.08, depth: 0.1 }, scene);
    mesh.rotationQuaternion = new this.context.BABYLON.Quaternion();
    mesh.isPickable = false;
    return mesh;
  }
}
class SystemAvatar {
  constructor() {
    this.name = "system-avatar";
    this.avatars = {};
  }
  init(context) {
    this.context = context;
    this.signalHub = context.signalHub;
    this.scene = context.scene;
    this.signalHub.incoming.on("component_upserted").subscribe((msg) => {
      const avatar = this.avatars[msg.id];
      if (avatar) {
        avatar.pose(msg.data.head, msg.data.left, msg.data.right);
      }
    });
  }
  countAvatars() {
    return Object.keys(this.avatars).length;
  }
  findAvatar(member_id) {
    return this.avatars[member_id];
  }
  deleteAvatar(member_id) {
    if (!this.avatars[member_id]) {
      return;
    }
    this.avatars[member_id].dispose();
    delete this.avatars[member_id];
  }
  dispose() {
  }
  initEntity(entity_id, components) {
    if (components.avatar) {
      if (!this.avatars[entity_id]) {
        this.avatars[entity_id] = new Avatar(entity_id, this.context);
      }
    }
  }
}
window["system-avatar"] = new SystemAvatar();
