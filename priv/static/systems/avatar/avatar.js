import * as BABYLON from "babylonjs";
import { unsetPosRot } from "../../../utils/misc";
const ANIMATION_FRAME_PER_SECOND = 60;
const TOTAL_ANIMATION_FRAMES = 5;
export class Avatar {
  constructor(entity_id, context, createhead = true) {
    this.entity_id = entity_id;
    this.context = context;
    this.scene = this.context.scene;
    this.signalHub = this.context.signalHub;
    this.transform = new BABYLON.TransformNode(entity_id, this.scene);
    this.member_id = entity_id;
    this.mode = "STANDING";
    this.animatables = [];
    this.debug = false;
    this.height = 1.6;
    if (createhead) {
      this.head = Avatar.findOrCreateAvatarHead(this.member_id, this.scene);
      this.head.position.y = this.height;
      this.head.setParent(this.transform);
    }
    this.leftHand = Avatar.findOrCreateAvatarHand(this.member_id, "left", this.scene);
    this.rightHand = Avatar.findOrCreateAvatarHand(this.member_id, "right", this.scene);
    this.setHandRaisedPosition(this.leftHand, "left");
    this.setHandRaisedPosition(this.rightHand, "right");
    if (this.debug) {
      this.debugHead = BABYLON.MeshBuilder.CreateSphere("", { diameter: 0.2 }, this.scene);
      this.debugLeftHand = BABYLON.MeshBuilder.CreateSphere("", { diameter: 0.2 }, this.scene);
      this.debugRightHand = BABYLON.MeshBuilder.CreateSphere("", { diameter: 0.2 }, this.scene);
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
    this.animatables.push(BABYLON.Animation.CreateAndStartAnimation("", mesh, "position", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, mesh.position, BABYLON.Vector3.FromArray(pose.pos), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT));
    let newQuaternion;
    if (pose.rot.length === 4) {
      newQuaternion = BABYLON.Quaternion.FromArray(pose.rot);
    } else if (pose.rot.length === 3) {
      newQuaternion = BABYLON.Quaternion.FromEulerAngles(pose.rot[0], pose.rot[1], pose.rot[2]);
    }
    this.animatables.push(BABYLON.Animation.CreateAndStartAnimation("", mesh, "rotationQuaternion", ANIMATION_FRAME_PER_SECOND, TOTAL_ANIMATION_FRAMES, mesh.rotationQuaternion, newQuaternion, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT));
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
      this.debugHead.position = BABYLON.Vector3.FromArray(headPose.pos);
      if (leftPose) {
        this.debugLeftHand.position = BABYLON.Vector3.FromArray(leftPose.pos);
      }
      if (rightPose) {
        this.debugRightHand.position = BABYLON.Vector3.FromArray(rightPose.pos);
      }
    }
    this.stopPreviousAnimations();
    if (this.head) {
      this.poseMeshUsingPosRot(this.head, headPose);
    } else {
      const cam = this.scene.activeCamera;
      cam.position.copyFromFloats(headPose.pos[0], headPose.pos[1], headPose.pos[2]);
      cam.rotationQuaternion = BABYLON.Quaternion.FromArray(headPose.rot);
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
  static findAvatarHead(member_id, scene) {
    const headName = `avatar_${member_id}_head`;
    return scene.getMeshByName(headName);
  }
  static findOrCreateAvatarHead(member_id, scene) {
    const headName = `avatar_${member_id}_head`;
    const head = this.findAvatarHead(member_id, scene);
    if (head) {
      return head;
    }
    const box = BABYLON.MeshBuilder.CreateBox(headName, { size: 0.3 }, scene);
    return box;
  }
  static findAvatarHand(member_id, hand, scene) {
    const meshName = `avatar_${member_id}_${hand}`;
    return scene.getMeshByName(meshName);
  }
  static findOrCreateAvatarHand(member_id, hand, scene) {
    const meshName = `avatar_${member_id}_${hand}`;
    let mesh = this.findAvatarHand(member_id, hand, scene);
    if (mesh) {
      return mesh;
    }
    mesh = BABYLON.MeshBuilder.CreateBox(meshName, { width: 0.053, height: 0.08, depth: 0.1 }, scene);
    mesh.rotationQuaternion = new BABYLON.Quaternion();
    mesh.isPickable = false;
    return mesh;
  }
  grabEntity(hand, entity_id, entity_pos_rot, hand_pos_rot) {
    const entity = this.scene.getMeshById(entity_id);
    if (!entity) {
      return;
    }
    if (entity.physicsImpostor) {
      entity.physicsImpostor.dispose();
      entity.physicsImpostor = null;
    }
    const handMesh = Avatar.findAvatarHand(this.member_id, hand, this.scene);
    if (!handMesh) {
      return;
    }
    if (!handMesh.parent) {
      handMesh.position = BABYLON.Vector3.FromArray(hand_pos_rot.pos);
      handMesh.rotationQuaternion = BABYLON.Quaternion.FromArray(hand_pos_rot.rot);
    }
    unsetPosRot(entity);
    entity.parent = null;
    if (BABYLON.Tags.MatchesQuery(entity, "shootable")) {
      entity.parent = handMesh;
    } else {
      entity.position = BABYLON.Vector3.FromArray(entity_pos_rot.pos);
      entity.rotationQuaternion = BABYLON.Quaternion.FromArray(entity_pos_rot.rot);
      entity.setParent(handMesh);
    }
  }
  releaseEntity(entity_id, entity_pos_rot, linear_velocity, angular_velocity) {
    const entity = this.scene.getMeshById(entity_id);
    if (entity) {
      entity.parent = null;
      entity.position = BABYLON.Vector3.FromArray(entity_pos_rot.pos);
      entity.rotationQuaternion = BABYLON.Quaternion.FromArray(entity_pos_rot.rot);
    }
    if (linear_velocity) {
      entity.physicsImpostor = new BABYLON.PhysicsImpostor(entity, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, friction: 0.8, restitution: 0.5 }, this.scene);
      entity.physicsImpostor.setLinearVelocity(BABYLON.Vector3.FromArray(linear_velocity));
      if (angular_velocity) {
        entity.physicsImpostor.setAngularVelocity(BABYLON.Vector3.FromArray(angular_velocity));
      }
    }
  }
  collectEntity(entity_id) {
    const entity = this.scene.getMeshById(entity_id);
    if (entity) {
      entity.parent = null;
      entity.visibility = 0;
      entity.setEnabled(false);
    }
  }
}
