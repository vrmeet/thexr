const ANIMATION_FRAME_PER_SECOND = 60;
const TOTAL_ANIMATION_FRAMES = 5;
class Avatar {
  constructor(entity_id, components, context) {
    this.entity_id = entity_id;
    this.components = components;
    this.context = context;
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
    this.pose(components.avatar);
  }
  dispose() {
    this.head.dispose();
    this.leftHand.dispose();
    this.rightHand.dispose();
  }
  poseMeshUsingPosRot(mesh, posRot) {
    if (!mesh) {
      return;
    }
    if (mesh.parent) {
      mesh.setParent(null);
    }
    mesh.position.fromArray(posRot.pos);
    let newQuaternion;
    if (posRot.rot.length === 4) {
      newQuaternion = this.context.BABYLON.Quaternion.FromArray(posRot.rot);
    } else if (posRot.rot.length === 3) {
      newQuaternion = this.context.BABYLON.Quaternion.FromEulerAngles(posRot.rot[0], posRot.rot[1], posRot.rot[2]);
    }
    mesh.rotationQuaternion = newQuaternion;
  }
  setHandRaisedPosition(handMesh, hand) {
    if (handMesh.parent) {
      return;
    }
    let offset;
    if (hand[0] === "l") {
      offset = [-0.2, 0, 0.2];
    } else {
      offset = [0.2, 0, 0.2];
    }
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
  pose(avatarComponent) {
    this.poseMeshUsingPosRot(this.head, avatarComponent.head);
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
    const box = this.context.BABYLON.MeshBuilder.CreateBox(headName, { size: 0.3 }, this.scene);
    box.rotationQuaternion = new this.context.BABYLON.Quaternion();
    box.isPickable = false;
    box.visibility = 0.5;
    if (this.entity_id === this.context.my_member_id) {
      box.setEnabled(false);
    }
    return box;
  }
  findAvatarHand(hand) {
    const meshName = `avatar_${this.entity_id}_${hand}`;
    return this.scene.getMeshByName(meshName);
  }
  findOrCreateAvatarHand(hand) {
    const meshName = `avatar_${this.entity_id}_${hand}`;
    let mesh = this.findAvatarHand(hand);
    if (mesh) {
      return mesh;
    }
    mesh = this.context.BABYLON.MeshBuilder.CreateBox(meshName, { width: 0.053, height: 0.08, depth: 0.1 }, this.scene);
    mesh.rotationQuaternion = new this.context.BABYLON.Quaternion();
    mesh.isPickable = false;
    mesh.visibility = 0.5;
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
    this.context.signalHub.incoming.on("entities_deleted").subscribe((evt) => {
      evt.ids.forEach((id) => {
        if (this.avatars[id]) {
          this.avatars[id].dispose();
          delete this.avatars[id];
        }
      });
    });
    this.signalHub.incoming.on("components_upserted").subscribe((msg) => {
      const avatar = this.avatars[msg.id];
      if (avatar) {
        if (msg.id !== this.context.my_member_id) {
          avatar.pose(msg.components.avatar);
        }
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
        this.avatars[entity_id] = new Avatar(entity_id, components, this.context);
      }
    }
  }
}
window["system-avatar"] = new SystemAvatar();
