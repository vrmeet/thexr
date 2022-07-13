
import * as BABYLON from "babylonjs"
import type { PosRot } from "../types"

const ANIMATION_FRAME_PER_SECOND = 60
const TOTAL_ANIMATION_FRAMES = 5

export class Avatar {
    public mode: "LAYING" | "STANDING" | "SITTING" // useful for aiding body estimate
    public height: number // actual height of user
    public head: BABYLON.AbstractMesh
    public rightHand: BABYLON.AbstractMesh
    public leftHand: BABYLON.AbstractMesh

    public debug: boolean
    public animatables: BABYLON.Animatable[]

    public debugHead: BABYLON.AbstractMesh
    public debugLeftHand: BABYLON.AbstractMesh
    public debugRightHand: BABYLON.AbstractMesh


    constructor(public member_id: string, public scene: BABYLON.Scene) {
        this.mode = "STANDING"
        this.animatables = []
        this.debug = false
        this.height = 1.6
        this.head = Avatar.findOrCreateAvatarHead(this.member_id, this.scene)
        this.head.position.y = this.height
        this.leftHand = Avatar.findOrCreateAvatarHand(this.member_id, "left", this.scene)
        this.rightHand = Avatar.findOrCreateAvatarHand(this.member_id, "right", this.scene)
        this.setHandRaisedPosition(this.leftHand, "left")
        this.setHandRaisedPosition(this.rightHand, "right")
        // create debug spheres
        if (this.debug) {
            this.debugHead = BABYLON.MeshBuilder.CreateSphere("", { diameter: 0.2 }, this.scene)
            this.debugLeftHand = BABYLON.MeshBuilder.CreateSphere("", { diameter: 0.2 }, this.scene)
            this.debugRightHand = BABYLON.MeshBuilder.CreateSphere("", { diameter: 0.2 }, this.scene)
        }
    }

    dispose() {
        this.head.dispose()
        this.leftHand.dispose()
        this.rightHand.dispose()
    }

    poseMeshUsingPosRot(mesh: BABYLON.AbstractMesh, pose: PosRot) {

        // if we're getting a hand position, then free the hand from the face
        if (mesh.parent) {
            mesh.setParent(null)
        }

        this.animatables.push(BABYLON.Animation.CreateAndStartAnimation("", mesh,
            "position",
            ANIMATION_FRAME_PER_SECOND,
            TOTAL_ANIMATION_FRAMES,
            mesh.position,
            BABYLON.Vector3.FromArray(pose.pos),
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT)
        )

        let newQuaternion;
        if (pose.rot.length === 4) {
            newQuaternion = BABYLON.Quaternion.FromArray(pose.rot)
        } else if (pose.rot.length === 3) {
            newQuaternion = BABYLON.Quaternion.FromEulerAngles(pose.rot[0], pose.rot[1], pose.rot[2])
        }
        this.animatables.push(
            BABYLON.Animation.CreateAndStartAnimation("", mesh,
                "rotationQuaternion",
                ANIMATION_FRAME_PER_SECOND,
                TOTAL_ANIMATION_FRAMES,
                mesh.rotationQuaternion,
                newQuaternion,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT)
        )

    }

    setHandRaisedPosition(handMesh: BABYLON.AbstractMesh, hand: string) {
        if (handMesh.parent) {
            return
        }
        Avatar.setHandRaisedPosition(this.head, handMesh, hand)
        handMesh.setParent(this.head)
    }

    static setHandRaisedPosition(headNode: BABYLON.TransformNode, handMesh: BABYLON.AbstractMesh, hand: string) {
        let offset;
        if (hand[0] === "l") {
            offset = [-0.2, 0, 0.2]
        } else {
            offset = [0.2, 0, 0.2]
        }
        handMesh.parent = headNode
        handMesh.rotationQuaternion.copyFromFloats(0, 0, 0, 1)
        handMesh.position.copyFromFloats(offset[0], offset[1], offset[2])
        handMesh.setParent(null)

    }

    stopPreviousAnimations() {
        this.animatables.forEach(a => {
            a.stop()
        })
        this.animatables = []
    }

    pose(headPose: PosRot, leftPose: PosRot | null, rightPose: PosRot | null) {
        if (this.debug) {
            this.debugHead.position = BABYLON.Vector3.FromArray(headPose.pos)
            if (leftPose) {
                this.debugLeftHand.position = BABYLON.Vector3.FromArray(leftPose.pos)
            }
            if (rightPose) {
                this.debugRightHand.position = BABYLON.Vector3.FromArray(rightPose.pos)
            }
        }

        this.stopPreviousAnimations()
        this.poseMeshUsingPosRot(this.head, headPose)
        if (leftPose) {
            this.poseMeshUsingPosRot(this.leftHand, leftPose)
        } else {
            this.setHandRaisedPosition(this.leftHand, "left")
        }
        if (rightPose) {
            this.poseMeshUsingPosRot(this.rightHand, rightPose)
        } else {
            this.setHandRaisedPosition(this.rightHand, "right")
        }
    }

    static findAvatarHead(member_id: string, scene: BABYLON.Scene) {
        const headName = `avatar_${member_id}_head`
        return scene.getMeshByName(headName)
    }



    static findOrCreateAvatarHead(member_id: string, scene: BABYLON.Scene) {
        const headName = `avatar_${member_id}_head`
        let head = this.findAvatarHead(member_id, scene)
        if (head) {
            return head
        }
        let box = BABYLON.MeshBuilder.CreateBox(headName, { size: 0.3 }, scene)
        box.rotationQuaternion = new BABYLON.Quaternion()
        //  box.isPickable = false
        box.metadata ||= {}
        box.metadata['member_id'] = member_id
        BABYLON.Tags.AddTagsTo(box, "avatar")
        box.visibility = 0.5
        return box
    }

    static findAvatarHand(member_id: string, hand: string, scene: BABYLON.Scene) {
        const meshName = `avatar_${member_id}_${hand}`
        return scene.getMeshByName(meshName)
    }


    static findOrCreateAvatarHand(member_id: string, hand: string, scene: BABYLON.Scene) {
        const meshName = `avatar_${member_id}_${hand}`
        let mesh = this.findAvatarHand(member_id, hand, scene)
        if (mesh) {
            return mesh
        }
        mesh = BABYLON.MeshBuilder.CreateBox(meshName, { width: 0.053, height: 0.08, depth: 0.1 }, scene)
        mesh.rotationQuaternion = new BABYLON.Quaternion()
        mesh.isPickable = false
        return mesh
    }
}