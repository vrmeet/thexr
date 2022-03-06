import { BehaviorSubject } from "rxjs";
import { scan, map, take } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";
import { WebRTCClientAgora } from "./web-rtc-client-agora";

export class WebRTCManager {
    public webRTCClient: WebRTCClientAgora
    public agora_app_id: string
    public micMuted: BehaviorSubject<boolean>
    public publishingAudio: BehaviorSubject<boolean>

    constructor(public orchestrator: Orchestrator) {
        this.micMuted = new BehaviorSubject(true)
        this.publishingAudio = new BehaviorSubject(false)
        this.webRTCClient = new WebRTCClientAgora(this.orchestrator.slug, this.orchestrator.member_id)
        signalHub.local.on('space_channel_connected').pipe(
            take(1)
        ).subscribe(resp => {
            this.agora_app_id = resp.agora_app_id
        })
        this.setupWebRTCEvents()
    }

    setupWebRTCEvents() {

        // join conditions:
        // (unmuted member count > 0 && member count > 1)

        signalHub.observables.memberStates.pipe(
            map(memberStates => {
                return Object.entries(memberStates).reduce((acc, [member_id, state]) => {
                    acc.member_count += 1
                    if (state.mic_pref === 'on') {
                        acc.mic_on_count += 1
                    }
                    return acc
                }, { mic_on_count: 0, member_count: 0 })
            })
        ).subscribe(async result => {
            console.log('web rtc manager', result)
            if (result.mic_on_count > 0 && result.member_count > 1) {
                this.webRTCClient.join(this.agora_app_id)
                await this.webRTCClient.publishAudio()
                // signalHub.outgoing.emit('member_state_changed', )
            } else {

                await this.webRTCClient.leave()
            }
        })

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