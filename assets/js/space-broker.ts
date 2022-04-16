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
    public space_id: string
    public socket: Socket
    public spaceChannel: Channel
    public member_id: string

    // public initialized: Promise<any>
    public channelParams: { choice: string }

    constructor(public orchestrator: Orchestrator) {
        this.member_id = orchestrator.member_id
        this.space_id = orchestrator.space_id
        this.socket = new Socket('/socket', { params: { token: window['userToken'] } })
        this.channelParams = { choice: null }
        this.spaceChannel = this.socket.channel(`space:${this.space_id}`, this.channelParams)

        // listen for clicked join button
        const $cameraReady = signalHub.local.on('camera_ready')
        const $client_ready = signalHub.local.on('client_ready')

        $client_ready.subscribe(choiceValue => {
            this.channelParams.choice = choiceValue
            this.connectToChannel()
        })

        const $enter = $client_ready.pipe(
            filter(value => (value === 'enter'))
        )

        this.setupChannelSubscriptions()

        combineLatest([$cameraReady, $enter]).subscribe(([posRot, _]) => {
            // set this value for channel params as we join
            // this.channelParams.pos_rot = posRot
            // this.channelParams.state.updated_at = Date.now()
            // this.connectToChannel()
            this.forwardCameraMovement()
            // this.forwardMicPrefAsState()
            console.log('start forwarding camera movement')

        })

        // send a command to enter | observe after we've joined the channel
        const $space_channel_connected = signalHub.local.on('space_channel_connected')
        combineLatest([$cameraReady, $client_ready, $space_channel_connected]).subscribe(([pos_rot, choice, _]) => {

            if (choice === 'enter') {
                signalHub.outgoing.emit('event', { m: 'member_entered', p: { member_id: this.member_id, pos_rot: pos_rot, state: this.orchestrator.memberStates.my_state() } })
            } else {
                signalHub.outgoing.emit('event', { m: 'member_observed', p: { member_id: this.member_id } })
            }

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

        signalHub.outgoing.on('event').subscribe(mp => {
            this.spaceChannel.push('event', { ...mp, ts: (new Date()).getTime() })
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
        signalHub.movement.on("camera_moved").pipe(
            throttleTime(100)
        ).subscribe(msg => {
            signalHub.outgoing.emit('event', { m: 'member_moved', p: { member_id: this.member_id, pos_rot: msg } })
            //this.spaceChannel.push('camera_moved', msg)
        })
    }

    // forwardMicPrefAsState() {
    // snap shot of memberStates
    // signalHub.observables.mic_muted_pref.subscribe(isMuted => {
    //     console.log('this emitted called')
    //     signalHub.outgoing.emit('member_state_patched', { mic_pref: isMuted ? "off" : "on" })
    // })

    // }

}
