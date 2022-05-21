import { BehaviorSubject, merge } from "rxjs";
import { scan, map, take, tap, distinctUntilChanged, mergeAll, filter } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";
import { WebRTCClientAgora } from "./web-rtc-client-agora";
import type { member_state } from './types'

export class WebRTCManager {
    public webRTCClient: WebRTCClientAgora
    public agora_app_id: string

    constructor(public orchestrator: Orchestrator) {
        this.webRTCClient = new WebRTCClientAgora(this.orchestrator.space_id, this.orchestrator.member_id)
        //     // default audio playback behavior
        this.webRTCClient.addRemoteStreamPublishedCallback((member_id, mediaType, playable, mediaStreamTrack) => {
            console.log('this user is now publishing audio', member_id);
            playable.play()
        })

        // first setup listeners/behaviors for joining leaving agora client
        this.setupListeners()
        // listeners only work if there is an app id
        signalHub.local.on('space_channel_connected').pipe(
            take(1)
        ).subscribe(resp => {
            this.agora_app_id = resp.agora_app_id
        })

    }

    setupListeners() {
        console.log('web rtc events setting up')

        signalHub.local.on("member_states_changed").pipe(
            map((states: { [member_id: string]: member_state }) => {
                return Object.entries(states).reduce((acc, [member_id, state]) => {
                    acc.member_count += 1
                    if (!state.mic_muted) {
                        acc.mic_on_count += 1
                    }
                    return acc
                }, { mic_on_count: 0, member_count: 0 })
            }),
            // filter by the final condition we care about
            map(obj => (obj.mic_on_count > 0 && obj.member_count > 1)),
            // ignore dups
            distinctUntilChanged()
        ).subscribe(async should_join => {
            if (should_join) {
                console.log("publishing my audio")
                await this.webRTCClient.join(this.agora_app_id)
                await this.webRTCClient.publishAudio()
            } else {
                console.log("stopped my audio")
                await this.webRTCClient.unpublishAudio()
                await this.webRTCClient.leave()
            }
        })

    }

}