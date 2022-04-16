
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";
import type { member_state } from "./types";
import { filter } from 'rxjs/operators'
import { event } from './types'

export class MemberStates {
    public my_member_id: string
    public members: { [member_id: string]: member_state }

    constructor(public orchestrator: Orchestrator) {
        this.my_member_id = orchestrator.member_id
        this.members = {
            [this.my_member_id]: { mic_muted: true, nickname: "unset nickname" }
        }

        signalHub.incoming.on("about_members").subscribe(members => {
            for (const [member_id, state] of Object.entries(members.states)) {
                this.members[member_id] = state
            }
        })

        signalHub.incoming.on("event").pipe(
            filter(msg => msg.m === "member_entered")
        ).subscribe((evt: any) => {
            this.members[evt.p.member_id] = evt.p.state
        })

        signalHub.incoming.on("event").pipe(
            filter(msg => msg.m === "member_changed_mic_pref")
        ).subscribe((evt: any) => {
            // TODO, figure out why typescript can't figure out correct type
            // so I had to use 'any'
            this.update_mic_pref(evt.p.member_id, evt.p.mic_muted)
        })
    }

    update_mic_pref(member_id: string, mic_muted_pref: boolean) {
        this.members[member_id].mic_muted = mic_muted_pref
    }

    update_my_nickname(nickname) {
        this.members[this.my_member_id].nickname = nickname
    }

    my_state() {
        return this.members[this.my_member_id]
    }

    my_mic_muted_pref() {
        return this.members[this.my_member_id].mic_muted
    }
}