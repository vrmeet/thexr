import { map, take } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";
import { WebRTCClientAgora } from "./web-rtc-client-agora";

export class WebRTCManager {
    public webRTCClient: WebRTCClientAgora
    public agora_app_id: string

    constructor(public orchestrator: Orchestrator) {
        this.webRTCClient = new WebRTCClientAgora(this.orchestrator.slug, this.orchestrator.member_id)
        signalHub.on('space_channel_connected').pipe(
            take(1)
        ).subscribe(resp => {
            this.agora_app_id = resp.agora_app_id
        })
        this.setupWebRTCEvents()
    }

    setupWebRTCEvents() {

        this.orchestrator.memberManager.memberStatesUpdated.pipe(
            map(() => {
                return Object.entries(this.orchestrator.memberManager.memberState).reduce((acc, [member_id, state]) => {
                    if (state.mic_pref === "on") {
                        return { ...acc, unMuteCount: acc.unMuteCount + 1, memberCount: acc.memberCount + 1 }
                    } else {
                        return { ...acc, memberCount: acc.memberCount + 1 }
                    }
                }, { unMuteCount: 0, memberCount: 0 })

            })
        ).subscribe(result => {
            if (result.unMuteCount > 0 && result.memberCount > 1) {
                this.webRTCClient.join(this.agora_app_id)
                console.log("join web rtc channel")
            } else {
                this.webRTCClient.leave()
                console.log("unjoin web rtc channel")
            }
        })

        // join conditions:
        // (unmuted member count > 0 && member count > 1)


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