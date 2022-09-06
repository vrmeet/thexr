import * as BABYLON from "babylonjs";
import { filter } from "rxjs/operators";
import type { Context } from "../../../context";
import { EventName } from "../../../event-names";
import type { SignalHub } from "../../../signalHub";
import { unsetPosRot } from "../../../utils/misc";
import type { Entity } from "../../entities/entity";
import type {
  IEntityCreatedEvent,
  IMemberEnteredEvent,
  IMemberMovedEvent,
  PosRot,
} from "../../../types";
import type { ComponentObj } from "../../components/component-obj";

const ANIMATION_FRAME_PER_SECOND = 60;
const TOTAL_ANIMATION_FRAMES = 5;

export class Avatar {
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
    public entity: Entity,
    public context: Context,
    createhead = true
  ) {
    this.scene = this.context.scene;
    this.signalHub = this.context.signalHub;
    this.transform = new BABYLON.TransformNode(entity.name, this.scene);
    this.entity.transformNode = this.transform;
    this.member_id = entity.name;
    this.mode = "STANDING";
    this.animatables = [];
    this.debug = false;
    this.height = 1.6;
    if (createhead) {
      this.head = Avatar.findOrCreateAvatarHead(this.member_id, this.scene);
      this.head.position.y = this.height;
      this.head.setParent(this.transform);
    }
    this.leftHand = Avatar.findOrCreateAvatarHand(
      this.member_id,
      "left",
      this.scene
    );
    this.rightHand = Avatar.findOrCreateAvatarHand(
      this.member_id,
      "right",
      this.scene
    );
    this.setHandRaisedPosition(this.leftHand, "left");
    this.setHandRaisedPosition(this.rightHand, "right");
    // create debug spheres
    if (this.debug) {
      this.debugHead = BABYLON.MeshBuilder.CreateSphere(
        "",
        { diameter: 0.2 },
        this.scene
      );
      this.debugLeftHand = BABYLON.MeshBuilder.CreateSphere(
        "",
        { diameter: 0.2 },
        this.scene
      );
      this.debugRightHand = BABYLON.MeshBuilder.CreateSphere(
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
      BABYLON.Animation.CreateAndStartAnimation(
        "",
        mesh,
        "position",
        ANIMATION_FRAME_PER_SECOND,
        TOTAL_ANIMATION_FRAMES,
        mesh.position,
        BABYLON.Vector3.FromArray(pose.pos),
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      )
    );

    let newQuaternion;
    if (pose.rot.length === 4) {
      newQuaternion = BABYLON.Quaternion.FromArray(pose.rot);
    } else if (pose.rot.length === 3) {
      newQuaternion = BABYLON.Quaternion.FromEulerAngles(
        pose.rot[0],
        pose.rot[1],
        pose.rot[2]
      );
    }
    this.animatables.push(
      BABYLON.Animation.CreateAndStartAnimation(
        "",
        mesh,
        "rotationQuaternion",
        ANIMATION_FRAME_PER_SECOND,
        TOTAL_ANIMATION_FRAMES,
        mesh.rotationQuaternion,
        newQuaternion,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
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
      // for use in resetting the position after respawn

      // TODO, if in XR, maybe just teleport to this point
      const cam = this.scene.activeCamera as BABYLON.FreeCamera;
      cam.position.copyFromFloats(
        headPose.pos[0],
        headPose.pos[1],
        headPose.pos[2]
      );
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

  static findAvatarHead(member_id: string, scene: BABYLON.Scene) {
    const headName = `avatar_${member_id}_head`;
    return scene.getMeshByName(headName);
  }

  static findOrCreateAvatarHead(member_id: string, scene: BABYLON.Scene) {
    const headName = `avatar_${member_id}_head`;
    const head = this.findAvatarHead(member_id, scene);
    if (head) {
      return head;
    }
    const box = BABYLON.MeshBuilder.CreateBox(headName, { size: 0.3 }, scene);
    // box.rotationQuaternion = new BABYLON.Quaternion();
    // box.isPickable = false;
    // box.metadata ||= {};
    // box.metadata["member_id"] = member_id;
    // BABYLON.Tags.AddTagsTo(box, "avatar");
    // box.visibility = 0.5;
    return box;
  }

  static findAvatarHand(member_id: string, hand: string, scene: BABYLON.Scene) {
    const meshName = `avatar_${member_id}_${hand}`;
    return scene.getMeshByName(meshName);
  }

  static findOrCreateAvatarHand(
    member_id: string,
    hand: string,
    scene: BABYLON.Scene
  ) {
    const meshName = `avatar_${member_id}_${hand}`;
    let mesh = this.findAvatarHand(member_id, hand, scene);
    if (mesh) {
      return mesh;
    }
    mesh = BABYLON.MeshBuilder.CreateBox(
      meshName,
      { width: 0.053, height: 0.08, depth: 0.1 },
      scene
    );
    mesh.rotationQuaternion = new BABYLON.Quaternion();
    mesh.isPickable = false;
    return mesh;
  }

  grabEntity(
    hand: string,
    entity_id: string,
    entity_pos_rot: PosRot | null,
    hand_pos_rot: PosRot | null
  ) {
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

    // case of avatar hands of someone else, in XR
    if (!handMesh.parent) {
      // we can set exact position of handMesh
      handMesh.position = BABYLON.Vector3.FromArray(hand_pos_rot.pos);
      handMesh.rotationQuaternion = BABYLON.Quaternion.FromArray(
        hand_pos_rot.rot
      );
    }

    unsetPosRot(entity);
    entity.parent = null;
    if (BABYLON.Tags.MatchesQuery(entity, "shootable")) {
      entity.parent = handMesh;
    } else {
      entity.position = BABYLON.Vector3.FromArray(entity_pos_rot.pos);
      entity.rotationQuaternion = BABYLON.Quaternion.FromArray(
        entity_pos_rot.rot
      );
      entity.setParent(handMesh);
    }
  }

  releaseEntity(
    entity_id: string,
    entity_pos_rot: PosRot,
    linear_velocity?: number[],
    angular_velocity?: number[]
  ) {
    const entity = this.scene.getMeshById(entity_id);
    if (entity) {
      entity.parent = null;
      entity.position = BABYLON.Vector3.FromArray(entity_pos_rot.pos);
      entity.rotationQuaternion = BABYLON.Quaternion.FromArray(
        entity_pos_rot.rot
      );
    }
    if (linear_velocity) {
      entity.physicsImpostor = new BABYLON.PhysicsImpostor(
        entity,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 1, friction: 0.8, restitution: 0.5 },
        this.scene
      );
      entity.physicsImpostor.setLinearVelocity(
        BABYLON.Vector3.FromArray(linear_velocity)
      );
      if (angular_velocity) {
        entity.physicsImpostor.setAngularVelocity(
          BABYLON.Vector3.FromArray(angular_velocity)
        );
      }
    }
  }

  collectEntity(entity_id: string) {
    const entity = this.scene.getMeshById(entity_id);
    if (entity) {
      entity.parent = null;
      entity.visibility = 0;
      entity.setEnabled(false);
    }
  }
}
