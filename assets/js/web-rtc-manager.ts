import { BehaviorSubject, merge } from "rxjs";
import { scan, map, take, tap, distinctUntilChanged, mergeAll } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";
import { WebRTCClientAgora } from "./web-rtc-client-agora";

export class WebRTCManager {
    public webRTCClient: WebRTCClientAgora
    public agora_app_id: string

    constructor(public orchestrator: Orchestrator) {
        this.webRTCClient = new WebRTCClientAgora(this.orchestrator.slug, this.orchestrator.member_id)
        signalHub.local.on('space_channel_connected').pipe(
            take(1)
        ).subscribe(resp => {
            this.agora_app_id = resp.agora_app_id
        })
        this.setupWebRTCEvents()
    }

    setupWebRTCEvents() {
        console.log('web rtc events setting up')
        // join conditions:
        // (unmuted member count > 0 && member count > 1)
        /*
        listen for
          members
          new_member
          member_state_updated
          presence_diff
        */
        const members = signalHub.incoming.on('members')
        const new_member = signalHub.incoming.on('new_member')
        const member_state_updated = signalHub.incoming.on('member_state_updated')
        const presence_diff = signalHub.incoming.on('presence_diff')


        merge([members, new_member, member_state_updated, presence_diff]).pipe(
            mergeAll(),
            scan((acc, value) => {
                if (value['member_id'] && value['state']) {
                    console.log('either new member or member_state updated')
                    acc[value['member_id']] = value['state']['mic_pref']
                } else if (value['states']) {
                    console.log('members')
                    Object.entries(value['states']).forEach(([member_id, state]) => {
                        acc[member_id] = state['mic_pref']
                    })
                } else if (value['leaves']) {
                    console.log('diff')
                    Object.entries(value['leaves']).forEach(([member_id, _]) => {
                        delete acc[member_id]
                    })
                }
                console.log(value, 'the acc', acc)
                return acc
            }, {}),
            map((allMicPrefs: { [member_id: string]: "on" | "off" }) => {
                return Object.entries(allMicPrefs).reduce((acc, [member_id, mic_pref]) => {
                    acc.member_count += 1
                    if (mic_pref === "on") {
                        acc.mic_on_count += 1
                    }
                    console.log('first map', acc)
                    return acc
                }, { mic_on_count: 0, member_count: 0 })
            }),
            map(obj => (obj.mic_on_count > 0 && obj.member_count > 1)),
            distinctUntilChanged()
        ).subscribe(async should_join => {
            if (should_join) {
                await this.webRTCClient.join(this.agora_app_id)
                await this.webRTCClient.publishAudio()
                // signalHub.outgoing.emit('member_state_changed', )
            } else {

                await this.webRTCClient.leave()
            }
        })



        // signalHub.observables.memberStates.pipe(
        //     map(memberStates => {
        //         return Object.entries(memberStates).reduce((acc, [member_id, state]) => {
        //             acc.member_count += 1
        //             if (state.mic_pref === 'on') {
        //                 acc.mic_on_count += 1
        //             }
        //             return acc
        //         }, { mic_on_count: 0, member_count: 0 })
        //     })
        // ).subscribe(async result => {
        //     console.log('web rtc manager', result)
        //     if (result.mic_on_count > 0 && result.member_count > 1) {
        //         this.webRTCClient.join(this.agora_app_id)
        //         await this.webRTCClient.publishAudio()
        //         // signalHub.outgoing.emit('member_state_changed', )
        //     } else {

        //         await this.webRTCClient.leave()
        //     }
        // })

        // this.orchestrator.memberManager.memberStatesUpdated.pipe(
        //     map(() => {
        //         return Object.entries(this.orchestrator.memberManager.memberState).reduce((acc, [member_id, state]) => {
        //             if (state.mic_pref === "on") {
        //                 return { ...acc, unMuteCount: acc.unMuteCount + 1, memberCount: acc.memberCount + 1 }
        //             } else {
        //                 return { ...acc, memberCount: acc.memberCount + 1 }
        //             }
        //         }, { unMuteCount: 0, memberCount: 0 })

        //     })
        // ).subscribe(async result => {
        //     if (result.unMuteCount > 0 && result.memberCount > 1) {
        //         this.webRTCClient.join(this.agora_app_id)
        //         if (!this.micMuted.getValue()) {
        //             await this.webRTCClient.publishAudio()
        //             this.publishingAudio.next(true)
        //         }
        //         console.log("join web rtc channel")
        //     } else {

        //         await this.webRTCClient.leave()
        //         this.publishingAudio.next(false)
        //         console.log("unjoin web rtc channel")
        //     }
        // })



        // this.orchestrator.memberManager.memberState$.pipe(
        //     scan((acc, newStates) => {
        //         return Object.keys(newStates).reduce(member_id => { }, {})
        //     }, { memberCount: 0, unmutedCount: 0 })
        // ).subscribe(state => {
        //     console.log('memberStates', state)
        // })

        // default audio playback behavior
        this.webRTCClient.addRemoteStreamPublishedCallback((member_id, mediaType, playable, mediaStreamTrack) => {
            console.log('this user is now publishing audio', member_id);
            playable.play()
        })

    }

}