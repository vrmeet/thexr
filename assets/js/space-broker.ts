import { Socket, Channel } from 'phoenix'
import type { Orchestrator } from './orchestrator'
import { signalHub } from './signalHub'
import { merge, mergeWith, take, throttleTime, withLatestFrom } from 'rxjs/operators'
import { combineLatest, map, filter } from 'rxjs'
import type { IncomingEvents } from './signalHub'
import type { PosRot } from './types'

type ChannelParams = {
    pos_rot: PosRot,
    state: {
        mic_pref: string,
        video_pref: string,
        audio_actual: string,
        video_actual: string,
        nickname: string,
        handraised: boolean,
        updated_at: number
    }
}


export class SpaceBroker {
    public slug: string
    public socket: Socket
    public spaceChannel: Channel
    public member_id: string

    // public initialized: Promise<any>
    // public channelParams: ChannelParams

    constructor(public orchestrator: Orchestrator) {
        this.member_id = orchestrator.member_id
        this.slug = orchestrator.slug
        this.socket = new Socket('/socket', { params: { token: window['userToken'] } })
        // this.channelParams = {
        //     pos_rot: undefined,
        //     state: {
        //         mic_pref: "off",
        //         video_pref: "off",
        //         audio_actual: "unpublished",
        //         video_actual: "unpublished",
        //         nickname: "string",
        //         handraised: false,
        //         updated_at: Date.now()
        //     }
        // }
        this.spaceChannel = this.socket.channel(`space:${this.slug}`)

        // listen for clicked join button
        const $cameraReady = signalHub.local.on('camera_ready')
        const $interaction_choice = signalHub.local.on('interaction_choice')

        $interaction_choice.subscribe(() => {
            this.connectToChannel()
        })

        const $enter = $interaction_choice.pipe(
            filter(value => (value === 'enter'))
        )

        this.setupChannelSubscriptions()

        combineLatest([$cameraReady, $enter]).subscribe(([posRot, _]) => {
            // set this value for channel params as we join
            // this.channelParams.pos_rot = posRot
            // this.channelParams.state.updated_at = Date.now()
            // this.connectToChannel()
            // this.forwardCameraMovement()
            // this.forwardMicPrefAsState()
            console.log('start forwarding camera movement')

        })

        // send a command to enter | observe after we've joined the channel
        const $space_channel_connected = signalHub.local.on('space_channel_connected')
        combineLatest([$interaction_choice, $space_channel_connected]).subscribe(([choice, _]) => {
            console.log('send command', choice)

            signalHub.outgoing.emit('command', [choice, { member_id: this.member_id }])
        })

    }


    setupChannelSubscriptions() {

        // forward incoming from channel to event bus
        this.spaceChannel.onMessage = (event: keyof IncomingEvents, payload) => {
            if (!event.startsWith('phx_') && !event.startsWith('chan_')) {
                console.log('channel incoming', event, payload)
                signalHub.incoming.emit(event, payload)
            }
            return payload
        }



        // forward outgoing from eventbus to channel
        // TODO, this is kinda redundant
        // signalHub.outgoing.on('member_state_changed').subscribe(state => {
        //     this.spaceChannel.push('member_state_changed', state)
        // })
        // signalHub.outgoing.on('member_state_patched').subscribe(state => {
        //     console.log('receive member state patched', state)
        //     //this.spaceChannel.push('member_state_patched', state)
        // })
        // signalHub.outgoing.on('spaces_api').subscribe(payload => {

        //     this.spaceChannel.push('spaces_api', payload)
        // })

        signalHub.outgoing.on('command').subscribe(tuple => {
            this.spaceChannel.push('command', [...tuple, (new Date()).getTime()])
        })

        signalHub.incoming.on("server_lost").subscribe(() => {
            window.location.href = '/';
        })


    }

    connectToChannel() {
        this.socket.connect()
        this.spaceChannel.join()
            .receive('ok', resp => {
                signalHub.local.emit('space_channel_connected', resp)
                window['channel'] = this.spaceChannel
            })
            .receive('error', resp => {
                console.error('Unable to join space channel', resp)
            })
    }

    forwardCameraMovement() {
        // forward camera movement
        signalHub.observables.camera_moved.pipe(
            throttleTime(100)
        ).subscribe(msg => {
            this.spaceChannel.push('camera_moved', msg)
        })
    }

    forwardMicPrefAsState() {
        // snap shot of memberStates
        signalHub.observables.mic_muted_pref.subscribe(isMuted => {
            console.log('this emitted called')
            signalHub.outgoing.emit('member_state_patched', { mic_pref: isMuted ? "off" : "on" })
        })

    }

}
