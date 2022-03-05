import { Socket, Channel } from 'phoenix'
import type { Orchestrator } from './orchestrator'
import { signalHub } from './signalHub'
import { throttleTime, withLatestFrom } from 'rxjs/operators'
import { combineLatest, map, filter } from 'rxjs'
import type { PosRot } from './types'
import type { IncomingEvents } from './signalHub'

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
        const $cameraReady = signalHub.local.on('camera_ready')
        const $joined = signalHub.local.on('joined')
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
            this.forwardMicPrefAsState()

        })

    }


    setupChannelSubscriptions() {

        // forward incoming from channel to event bus
        this.spaceChannel.onMessage = (event: keyof IncomingEvents, payload) => {
            if (!event.startsWith('phx_') && !event.startsWith('chan_')) {
                signalHub.incoming.emit(event, payload)
            }
            return payload
        }

        // forward outgoing from eventbus to channel
        signalHub.outgoing.on('member_state_changed').subscribe(new_state => {
            this.spaceChannel.push('member_state_changed', new_state)
        })

        signalHub.incoming.on("server_lost").subscribe(() => {
            window.location.href = '/';
        })

        // TODO move to outgoing
        signalHub.local.on('spaces_api').subscribe(payload => {
            this.spaceChannel.push('spaces_api', payload)
        })
    }

    connectToChannel() {
        this.socket.connect()
        this.spaceChannel.join()
            .receive('ok', resp => {
                console.log('Joined successfully', resp)
                signalHub.local.emit('space_channel_connected', resp)
                window['channel'] = this.spaceChannel
            })
            .receive('error', resp => {
                console.log('Unable to join space channel', resp)
            })
    }

    forwardCameraMovement() {
        // forward camera movement
        signalHub.local.on('camera_moved').pipe(
            throttleTime(100)
        ).subscribe(msg => {
            this.spaceChannel.push('camera_moved', msg)
        })
    }

    forwardMicPrefAsState() {
        // snap shot of memberStates
        const ownState = signalHub.observables.memberStates.pipe(
            map(states => {
                return states[this.orchestrator.member_id]
            }),
            filter(value => !!value),
        )
        const micPref = signalHub.local.on('mic').pipe(
            withLatestFrom(ownState),
            map(([mic_pref, state]) => {
                state.mic_pref = mic_pref
                return state
            })
        ).subscribe(newLocalState => {
            signalHub.outgoing.emit('member_state_changed', newLocalState)
            console.log('new local state', newLocalState)
        })

    }

}
