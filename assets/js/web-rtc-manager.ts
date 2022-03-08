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

        const members = signalHub.incoming.on('members')
        const new_member = signalHub.incoming.on('new_member')
        const member_state_updated = signalHub.incoming.on('member_state_updated')
        const presence_diff = signalHub.incoming.on('presence_diff')


        merge([members, new_member, member_state_updated, presence_diff]).pipe(
            mergeAll(),
            scan((acc, value) => {
                if (value['member_id'] && value['state']) {
                    acc[value['member_id']] = value['state']['mic_pref']
                } else if (value['states']) {
                    Object.entries(value['states']).forEach(([member_id, state]) => {
                        acc[member_id] = state['mic_pref']
                    })
                } else if (value['leaves']) {
                    Object.entries(value['leaves']).forEach(([member_id, _]) => {
                        delete acc[member_id]
                    })
                }
                return acc
            }, {}),
            map((allMicPrefs: { [member_id: string]: "on" | "off" }) => {
                return Object.entries(allMicPrefs).reduce((acc, [member_id, mic_pref]) => {
                    acc.member_count += 1
                    if (mic_pref === "on") {
                        acc.mic_on_count += 1
                    }
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
                await this.webRTCClient.unpublishAudio()
                await this.webRTCClient.leave()
            }
        })


        // default audio playback behavior
        this.webRTCClient.addRemoteStreamPublishedCallback((member_id, mediaType, playable, mediaStreamTrack) => {
            console.log('this user is now publishing audio', member_id);
            playable.play()
        })

    }

}