import type * as BABYLON from "babylonjs"
import { Avatar } from "./avatar"
import { signalHub } from "../signalHub"
import { EventName } from "../event-names"

export class AvatarManager {
    public avatars: { [member_id: string]: Avatar }
    constructor(public my_member_id: string, public scene: BABYLON.Scene) {
        this.avatars = {
            [my_member_id]: new Avatar(my_member_id, this.scene, false)
        }

        signalHub.incoming.on("about_members").subscribe(members => {
            for (const [member_id, payload] of Object.entries(members.movements)) {
                const avatar = this.createAvatar(member_id)
                avatar.pose(payload.pos_rot, null, null)
            }
        })

        signalHub.incoming.on("about_space").subscribe(about_space => {
            // move grabbed entities into the hands of avatars
            for (const [entity_id, event] of Object.entries(about_space.entities)) {
                if (event.m === EventName.entity_grabbed) {
                    this.findAvatar(event.p.member_id)?.grabEntity(event.p.hand, entity_id, event.p.entity_pos_rot, event.p.hand_pos_rot)
                } else if (event.m === EventName.entity_released) {
                    this.findAvatar(event.p.member_id)?.releaseEntity(event.p.entity_id, event.p.entity_pos_rot, event.p.lv, event.p.av)
                } else if (event.m === EventName.entity_collected) {
                    const avatar = this.findAvatar(event.p.member_id)?.collectEntity(event.p.entity_id)
                }
            }
        })


        signalHub.incoming.on("event").subscribe((mpts) => {
            if (mpts.m === EventName.member_entered) {
                const payload = mpts.p
                const avatar = this.createAvatar(payload.member_id)
                avatar.pose(payload.pos_rot, null, null)
            } else if (mpts.m === EventName.member_moved) {
                const payload = mpts.p
                const avatar = this.createAvatar(payload.member_id)
                avatar.pose(payload.pos_rot, payload.left, payload.right)
            } else if (mpts.m === EventName.member_left) {
                this.deleteAvatar(mpts.p.member_id)
            } else if (mpts.m === EventName.member_respawned) {
                const payload = mpts.p
                const avatar = this.createAvatar(payload.member_id)
                avatar.pose(payload.pos_rot, null, null)
            } else if (mpts.m === EventName.entity_grabbed) {
                this.findAvatar(mpts.p.member_id).grabEntity(mpts.p.hand, mpts.p.entity_id, mpts.p.entity_pos_rot, mpts.p.hand_pos_rot)
            } else if (mpts.m === EventName.entity_released) {
                this.findAvatar(mpts.p.member_id).releaseEntity(mpts.p.entity_id, mpts.p.entity_pos_rot, mpts.p.lv, mpts.p.av)
            } else if (mpts.m === EventName.entity_collected) {
                this.findAvatar(mpts.p.member_id).collectEntity(mpts.p.entity_id)
            }


        })
    }

    findAvatar(member_id: string) {
        return this.avatars[member_id]
    }

    createAvatar(member_id: string) {
        if (this.avatars[member_id]) {
            return this.avatars[member_id]
        }
        this.avatars[member_id] = new Avatar(member_id, this.scene)
        return this.avatars[member_id]
    }

    deleteAvatar(member_id: string) {
        if (!this.avatars[member_id]) {
            return
        }
        this.avatars[member_id].dispose()
        delete this.avatars[member_id]
    }


}