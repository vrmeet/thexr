import { Socket, Channel } from 'phoenix'
import type { Orchestrator } from './orchestrator'
import { signalHub } from './signalHub'
import { throttleTime } from 'rxjs/operators'
import { combineLatest, merge } from 'rxjs'
import type { PosRot } from './types'

export class SpaceBroker {
    public slug: string
    public socket: Socket
    public spaceChannel: Channel
    public initialized: Promise<any>
    public channelParams: any

    constructor(public orchestrator: Orchestrator) {
        this.slug = orchestrator.slug
        this.socket = new Socket('/socket', { params: { token: window['userToken'] } })
        this.channelParams = {}
        this.spaceChannel = this.socket.channel(`space:${this.slug}`, () => { return this.channelParams })

        // listen for clicked join button
        const $cameraReady = signalHub.on('camera_ready')
        const $joined = signalHub.on('joined')
        this.setupChannelSubscriptions()

        combineLatest([$cameraReady, $joined]).subscribe(([posRot, _]) => {
            // set this value for channel params as we join
            this.channelParams['pos_rot'] = posRot
            this.channelParams['state'] = {
                mic_pref: "off",
                video_pref: "off",
                audio_actual: "unpublished",
                video_actual: "unpublished",
                nickname: "string",
                handraised: false,
                updated_at: Date.now()
            }
            this.connectToChannel()
            this.forwardCameraMovement()

        })

    }


    setupChannelSubscriptions() {
        this.spaceChannel.on("server_lost", () => {
            window.location.href = '/';
        })

        signalHub.on('spaces_api').subscribe(payload => {
            this.spaceChannel.push('spaces_api', payload)
        })
    }

    connectToChannel() {
        this.socket.connect()
        this.spaceChannel.join()
            .receive('ok', resp => {
                console.log('Joined successfully', resp)
                signalHub.emit('space_channel_connected', resp)
                window['channel'] = this.spaceChannel
            })
            .receive('error', resp => {
                console.log('Unable to join space channel', resp)
            })
    }

    forwardCameraMovement() {
        // forward camera movement
        signalHub.on('camera_moved').pipe(
            throttleTime(100)
        ).subscribe(msg => {
            this.spaceChannel.push('camera_moved', msg)
        })
    }

}
