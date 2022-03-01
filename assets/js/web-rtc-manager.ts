import type { Orchestrator } from "./orchestrator";
import { WebRTCClientAgora } from "./web-rtc-client-agora";

export class WebRTCManager {
    public webRTCClient: WebRTCClientAgora

    constructor(public orchestrator: Orchestrator) {
        this.webRTCClient = new WebRTCClientAgora(this.orchestrator.slug, this.orchestrator.memberId)
        this.setupWebRTCEvents()
    }

    setupWebRTCEvents() {

        // default audio playback behavior
        this.webRTCClient.addRemoteStreamPublishedCallback((memberId, mediaType, playable, mediaStreamTrack) => {
            console.log('this user is now publishing audio', memberId);
            playable.play()
        })

    }

}