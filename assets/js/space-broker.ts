import { Socket, Channel } from 'phoenix'

import { signalHub } from './signalHub'
import { combineLatestWith, defaultIfEmpty, mergeWith, scan, throttleTime } from 'rxjs/operators'
import { combineLatest, map, filter } from 'rxjs'
import type { IncomingEvents } from './signalHub'
import type { PosRot } from './types'
import { arrayReduceSigFigs, throttleByMovement } from './utils'
import { EventName } from './event-names'

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

    public socket: Socket
    public spaceChannel: Channel
    public spaceChannelJoined: boolean

    // public initialized: Promise<any>
    public channelParams: { choice: string }

    constructor(public member_id: string, public space_id: string) {
        this.spaceChannelJoined = false
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

        })



    }


    setupChannelSubscriptions() {

        // forward incoming from channel to event bus
        this.spaceChannel.onMessage = (event: keyof IncomingEvents, payload) => {
            if (!event.startsWith('phx_') && !event.startsWith('chan_')) {
                //       console.log('channel incoming', event, payload)
                signalHub.incoming.emit(event, payload)
            }
            return payload
        }

        signalHub.outgoing.on('event').subscribe(mp => {
            if (this.spaceChannelJoined) {
                this.spaceChannel.push('event', { ...mp, ts: (new Date()).getTime() })
            }
        })

        signalHub.incoming.on("server_lost").subscribe(() => {
            window.location.href = '/';
        })
    }

    connectToChannel() {
        this.socket.connect()
        this.spaceChannel.join()
            .receive('ok', resp => {
                this.spaceChannelJoined = true
                signalHub.local.emit('space_channel_connected', resp)
                window['channel'] = this.spaceChannel
            })
            .receive('error', resp => {
                console.error('Unable to join space channel', resp)
            })
    }

    forwardCameraMovement() {

        let payload = {
            left: null,
            right: null,
            cam: null
        }

        signalHub.local.on("xr_state_changed").pipe(
            filter(msg => msg === BABYLON.WebXRState.EXITING_XR)
        ).subscribe(() => {
            payload.left = null
            payload.right = null
        })

        const leftMovement$ = signalHub.movement.on("left_hand_moved").pipe(
            throttleTime(50),
            map(orig => ({ pos: arrayReduceSigFigs(orig.pos), rot: arrayReduceSigFigs(orig.rot) })),
            throttleByMovement(0.005)
        )

        leftMovement$.subscribe(left => {
            payload.left = left
        })

        const rightMovement$ = signalHub.movement.on("right_hand_moved").pipe(
            throttleTime(50),
            map(orig => ({ pos: arrayReduceSigFigs(orig.pos), rot: arrayReduceSigFigs(orig.rot) })),
            throttleByMovement(0.005)
        )
        rightMovement$.subscribe(right => {
            payload.right = right
        })

        const camMovement$ = signalHub.movement.on("camera_moved").pipe(
            throttleTime(50),
            map(orig => ({ pos: arrayReduceSigFigs(orig.pos), rot: arrayReduceSigFigs(orig.rot) })),
            throttleByMovement(0.005)
        )

        camMovement$.subscribe(cam => {
            payload.cam = cam
        })

        camMovement$.pipe(
            mergeWith(leftMovement$, rightMovement$),
            throttleTime(50)
        ).subscribe(() => {
            if (!payload.cam) {
                return
            }

            if (payload.cam && payload.left && payload.right) {

                signalHub.outgoing.emit("event", {
                    m: EventName.member_moved,
                    p: { member_id: this.member_id, pos_rot: payload.cam, left: payload.left, right: payload.right }
                })
            } else {

                signalHub.outgoing.emit("event", {
                    m: EventName.member_moved,
                    p: { member_id: this.member_id, pos_rot: payload.cam }
                })
            }
        })

        /*
        
        
            merge(camMovement$, leftMovement$, rightMovement$)
              .pipe(
                scan((acc, data) => {
                  return { ...acc, ...data }
                }, { cam: undefined, left: undefined, right: undefined }),
                filter(data => (!!data.cam)),
                throttleTime(100)
              )
              .subscribe(data => {
                if (data.left && data.right) {
                  this.channel.push("i_moved", {
                    cam: data.cam,
                    left: data.left,
                    right: data.right
                  })
                } else {
                  this.channel.push("i_moved", {
                    cam: data.cam
                  })
                }
              })
        
        */



        // forward camera movement
        // signalHub.movement.on("camera_moved").pipe(
        //     throttleTime(100)
        // ).subscribe(msg => {
        //     signalHub.outgoing.emit('event', { m: 'member_moved', p: { member_id: this.member_id, pos_rot: msg } })
        //     //this.spaceChannel.push('camera_moved', msg)
        // })
    }

    // forwardMicPrefAsState() {
    // snap shot of memberStates
    // signalHub.observables.mic_muted_pref.subscribe(isMuted => {
    //     console.log('this emitted called')
    //     signalHub.outgoing.emit('member_state_patched', { mic_pref: isMuted ? "off" : "on" })
    // })

    // }

}
