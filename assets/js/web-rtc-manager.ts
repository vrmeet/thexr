import { scan } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { WebRTCClientAgora } from "./web-rtc-client-agora";

export class WebRTCManager {
    public webRTCClient: WebRTCClientAgora

    constructor(public orchestrator: Orchestrator) {
        this.webRTCClient = new WebRTCClientAgora(this.orchestrator.slug, this.orchestrator.memberId)
        // this.setupWebRTCEvents()
    }

    // setupWebRTCEvents() {

    //     join conditions:
    //       (unmuted member count > 0 && member count > 1)


    //     this.orchestrator.memberManager.memberState$.pipe(
    //         scan((acc, newStates) => {
    //             return Object.keys(newStates).reduce(memberId => {}, {})
    //         }, { memberCount: 0, unmutedCount: 0})
    //     ).subscribe(state => {
    //         console.log('memberStates', state)
    //     })

    //     // default audio playback behavior
    //     this.webRTCClient.addRemoteStreamPublishedCallback((memberId, mediaType, playable, mediaStreamTrack) => {
    //         console.log('this user is now publishing audio', memberId);
    //         playable.play()
    //     })

    // }

}