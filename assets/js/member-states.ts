

import { signalHub } from "./signalHub";
import type { member_state } from "./types";
import { filter } from 'rxjs/operators'
import type { event } from './types'
import { EventName } from "./event-names";
import { combineLatest } from "rxjs";

export class MemberStates {
    public my_member_id: string
    public members: { [member_id: string]: member_state }
    //  public client_ready: boolean

    constructor(member_id: string) {
        this.my_member_id = member_id
        //  this.client_ready = false

        const $cameraReady = signalHub.local.on('camera_ready')
        const $client_ready = signalHub.local.on('client_ready')
        // send a command to enter | observe after we've joined the channel
        const $space_channel_connected = signalHub.local.on('space_channel_connected')
        combineLatest([$cameraReady, $client_ready, $space_channel_connected]).subscribe(([pos_rot, choice, _]) => {

            if (choice === 'enter') {
                signalHub.outgoing.emit('event', { m: EventName.member_entered, p: { member_id: this.my_member_id, pos_rot: pos_rot, state: this.my_state() } })
            } else {
                signalHub.outgoing.emit('event', { m: EventName.member_observed, p: { member_id: this.my_member_id } })
            }

        })


        this.members = {
            [this.my_member_id]: { mic_muted: true, nickname: "unset nickname", health: 100 }
        }

        // $client_ready.subscribe(() => {
        //     this.client_ready = true
        // })

        signalHub.incoming.on("about_members").subscribe(members => {
            for (const [member_id, state] of Object.entries(members.states)) {
                this.merge_state(member_id, state)
            }
        })

        signalHub.incoming.on("event").pipe(
            filter(msg => msg.m === EventName.member_died)
        ).subscribe((evt: any) => {
            const nickname = this.members[evt.p["member_id"]].nickname
            signalHub.local.emit("hud_msg", `${nickname} died`)
        })

        signalHub.incoming.on("event").pipe(
            filter(msg => msg.m === EventName.member_entered)
        ).subscribe((evt: any) => {
            this.merge_state(evt.p.member_id, evt.p.state)
            signalHub.local.emit("hud_msg", `${this.members[evt.p.member_id].nickname} has entered`)
        })

        signalHub.incoming.on("event").pipe(
            filter(msg => msg.m === EventName.member_left)
        ).subscribe((evt) => {
            signalHub.local.emit("hud_msg", `${this.members[evt.p["member_id"]].nickname} has left`)

            this.merge_state(evt.p["member_id"], null)
        })

        signalHub.incoming.on("event").pipe(
            filter(msg => msg.m === EventName.member_changed_mic_pref || msg.m === EventName.member_changed_nickname)
        ).subscribe((evt: any) => {
            // TODO, figure out why typescript can't figure out correct type
            // so I had to use 'any'

            this.merge_state(evt.p.member_id, evt.p)
        })

        signalHub.menu.on("toggle_mic").subscribe(() => {
            let newValue = !this.my_mic_muted_pref()
            this.update_my_mic_muted_pref(newValue)
            signalHub.local.emit("my_state", this.my_state())
        })

        signalHub.menu.on("update_nickname").subscribe((nickname) => {
            this.update_my_nickname(nickname)
            signalHub.local.emit("my_state", this.my_state())
        })

        signalHub.local.on("client_ready").subscribe(() => {
            console.log('client is ready and state is', this.my_state())
            signalHub.local.emit("my_state", this.my_state())
        })
    }

    merge_state(member_id: string, attr: any | null) {
        if (attr === null) {
            delete this.members[member_id]
        } else {
            if (!this.members[member_id] && attr) {
                this.members[member_id] = { mic_muted: true, nickname: "unset nickname", health: 100 }
            }
            // copy in only the keys that are part of the state
            for (const key of Object.keys(attr)) {
                if (key in this.members[member_id]) {
                    this.members[member_id][key] = attr[key];
                }
            }
        }
        //   if (this.client_ready) {
        signalHub.local.emit("member_states_changed", this.members)
        //   }
    }



    update_my_mic_muted_pref(mic_muted_pref: boolean) {
        this.merge_state(this.my_member_id, { mic_muted: mic_muted_pref })
        const data: event = {
            m: EventName.member_changed_mic_pref,
            p: { member_id: this.my_member_id, mic_muted: mic_muted_pref }
        }
        this.emit_event(data)
    }


    update_my_nickname(nickname: string) {
        this.merge_state(this.my_member_id, { nickname: nickname })
        const data: event = {
            m: EventName.member_changed_nickname,
            p: { member_id: this.my_member_id, nickname: nickname }
        }
        this.emit_event(data)
    }


    emit_event(event) {
        // if (this.client_ready) {
        console.log("attempting to send event", JSON.stringify(event))
        signalHub.outgoing.emit("event", event)
        // }
    }


    my_state() {
        return this.members[this.my_member_id]
    }

    my_mic_muted_pref() {
        return this.members[this.my_member_id].mic_muted
    }
}

