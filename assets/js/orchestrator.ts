import { Socket, Channel } from 'phoenix'
import { filter, throttleTime, skip } from 'rxjs/operators'
import { WebRTCClientAgora } from './web-rtc-client-agora';
import { signalHub } from './signalHub'
import { SceneManager } from './sceneManager'
import App from "./App.svelte";
import { sessionPersistance } from './sessionPersistance';

import type { SceneSettings, SerializedSpace, SignalHub } from './types'

export class Orchestrator {
    public canvas;
    public scene: BABYLON.Scene;
    public engine;
    public socket: Socket;
    public spaceChannel: Channel
    public slug: string
    public entities: any[]
    public settings: SceneSettings
    public skyBox: BABYLON.Mesh
    public webRTCClient: WebRTCClientAgora
    public sceneManager: SceneManager


    constructor(public canvasId: string, public memberId: string, public serializedSpace: SerializedSpace) {
        this.socket = new Socket('/socket', { params: { token: window['userToken'] } })
        this.slug = serializedSpace.slug;
        this.webRTCClient = new WebRTCClientAgora(this.slug, this.memberId)

        // default audio playback behavior
        this.webRTCClient.addRemoteStreamPublishedCallback((memberId, mediaType, playable, mediaStreamTrack) => {
            console.log('this user is now publishing audio', memberId);
            playable.play()
        })

        this.sceneManager = new SceneManager(canvasId, memberId, signalHub, serializedSpace)

        this.spaceChannel = this.socket.channel(`space:${serializedSpace.slug}`, { pos_rot: this.sceneManager.getMyPosRot() })
        this.sceneManager.setChannel(this.spaceChannel)

        window['channel'] = this.spaceChannel

        this.spaceChannel.onMessage = (event: string, payload: any) => {
            if (!event.startsWith('phx_') && !event.startsWith('chan_')) {
                signalHub.next({ event, payload })
            }
            return payload;
        }


        this.spaceChannel.on("server_lost", () => {
            window.location.href = '/';
        })


        window['orchestrator'] = this

        new App({ target: document.body, props: { canvasId, webRTCClient: this.webRTCClient, slug: this.slug } });

    }

    joinSpace(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.socket.connect()
            this.spaceChannel.join()
                .receive('ok', resp => {
                    this.webRTCClient.join(resp.agora_app_id)
                    window['webRTCClient'] = this.webRTCClient;
                    console.log('Joined successfully')
                    resolve(resp)
                })
                .receive('error', resp => {
                    console.log('Unable to join', resp)
                    reject(resp)
                })

        })

    }


    forwardCameraMovement() {
        // forward camera movement
        signalHub.pipe(
            skip(1), // first pos/rot may not be correct as we're still putting it in position, besides we'll send this during space_channel connect
            filter(msg => (msg.event === 'camera_moved')),
            throttleTime(100)
        ).subscribe(msg => {
            this.spaceChannel.push(msg.event, msg.payload)
            sessionPersistance.saveCameraPosRot(msg.payload)
        })
    }


    async start() {
        this.sceneManager.createScene()
        // parse the scene for states

        this.sceneManager.run()

        // listen for clicked join button
        signalHub.pipe(
            filter(msg => (msg.event == 'joined'))
        ).subscribe(async () => {
            await this.joinSpace();
            this.forwardCameraMovement()
        })

        // forward space_api to the channel
        signalHub.pipe(
            filter(msg => (msg.event == "spaces_api"))
        ).subscribe(msg => {
            this.spaceChannel.push(msg.event, msg.payload)
        })



    }
}
window.addEventListener('DOMContentLoaded', async () => {
    const serializedSpace = window['serializedSpace']
    const memberId = window['memberId']
    const orchestrator = new Orchestrator('spaceCanvas', memberId, serializedSpace)
    orchestrator.start()
})


