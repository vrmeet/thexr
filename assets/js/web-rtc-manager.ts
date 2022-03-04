import { map } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { WebRTCClientAgora } from "./web-rtc-client-agora";

export class WebRTCManager {
    public webRTCClient: WebRTCClientAgora

    constructor(public orchestrator: Orchestrator) {
        this.webRTCClient = new WebRTCClientAgora(this.orchestrator.slug, this.orchestrator.memberId)
        this.setupWebRTCEvents()
    }

    setupWebRTCEvents() {

        this.orchestrator.memberManager.memberStatesUpdated.pipe(
            map(() => {
                return Object.entries(this.orchestrator.memberManager.memberState).reduce((acc, [memberId, state]) => {
                    if (state.micPref === "on") {
                        return { ...acc, unMuteCount: acc.unMuteCount + 1, memberCount: acc.memberCount + 1 }
                    } else {
                        return { ...acc, memberCount: acc.memberCount + 1 }
                    }
                }, { unMuteCount: 0, memberCount: 0 })

            })
        ).subscribe(result => {
            if (result.unMuteCount > 0 && result.memberCount > 1) {
                console.log("join web rtc channel")
            } else {
                console.log("unjoin web rtc channel")
            }
        })

        // join conditions:
        // (unmuted member count > 0 && member count > 1)


        // this.orchestrator.memberManager.memberState$.pipe(
        //     scan((acc, newStates) => {
        //         return Object.keys(newStates).reduce(memberId => { }, {})
        //     }, { memberCount: 0, unmutedCount: 0 })
        // ).subscribe(state => {
        //     console.log('memberStates', state)
        // })

        // default audio playback behavior
        this.webRTCClient.addRemoteStreamPublishedCallback((memberId, mediaType, playable, mediaStreamTrack) => {
            console.log('this user is now publishing audio', memberId);
            playable.play()
        })

    }

}