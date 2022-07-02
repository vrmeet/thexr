import * as BABYLON from "babylonjs"
import type { PosRot } from "../types"

export const findOrCreateAvatar = (member_id: string, scene: BABYLON.Scene) => {
    let box = scene.getMeshByName(`avatar_${member_id}`)
    if (!box) {
        box = BABYLON.MeshBuilder.CreateBox(`avatar_${member_id}`, { size: 0.3 }, scene)
        //  box.isPickable = false
        box.metadata ||= {}
        box.metadata['member_id'] = member_id
        BABYLON.Tags.AddTagsTo(box, "avatar")
    }
    return box
}

export const findAvatarHand = (member_id: string, hand: string, scene: BABYLON.Scene) => {
    const meshName = `avatar_${member_id}_${hand}`
    return scene.getMeshByName(meshName)
}



export const findOrCreateAvatarHand = (member_id: string, hand: string, pos_rot: PosRot, scene: BABYLON.Scene): BABYLON.AbstractMesh => {
    const meshName = `avatar_${member_id}_${hand}`
    let mesh = findAvatarHand(member_id, hand, scene)
    if (!mesh) {
        mesh = BABYLON.MeshBuilder.CreateBox(meshName, { size: 0.1 }, scene)
        mesh.isPickable = false
        mesh.position.fromArray(pos_rot.pos)
        mesh.rotationQuaternion = BABYLON.Quaternion.FromArray(pos_rot.rot)
    }
    return mesh
}



export const removeAvatarHand = (member_id: string, hand: string, scene: BABYLON.Scene) => {
    let mesh = findAvatarHand(member_id, hand, scene)
    if (mesh) {
        mesh.dispose()
    }
}

export const removeAvatar = (member_id: string, scene: BABYLON.Scene) => {
    let box = scene.getMeshByName(`avatar_${member_id}`)
    if (box) {
        box.dispose()
    }
    removeAvatarHand(member_id, "left", scene)
    removeAvatarHand(member_id, "right", scene)
}
