import { Socket, Channel } from 'phoenix'
import { Subject } from 'rxjs'
import { filter, throttleTime, skip } from 'rxjs/operators'
import { WebRTCClientAgora } from './web-rtc-client-agora';
import { signalHub } from './signalHub'
import { SceneManager } from './sceneManager'
import App from "./App.svelte";

import type { SceneSettings, SerializedSpace, SignalHub } from './types'



// type SceneSettings = {
//     use_skybox: boolean
//     skybox_inclination: number
//     clear_color: string
//     fog_color: string
//     fog_density: number
// }

// type SignalEvent = {
//     event: string
//     payload: any
// }

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


    constructor(public signalHub: SignalHub, public canvasId: string, public memberId: string, public serializedSpace: SerializedSpace) {
        this.socket = new Socket('/socket', { params: { token: window['userToken'] } })
        this.slug = serializedSpace.slug;
        this.webRTCClient = new WebRTCClientAgora(this.slug, this.memberId)

        // memberID: string,
        // mediaType: "audio" | "video",
        // playable: IPlayable,
        // mediaStreamTrack: MediaStreamTrack) => void

        this.webRTCClient.addRemoteStreamPublishedCallback((memberId, mediaType, playable, mediaStreamTrack) => {
            console.log('this user is now publishing audio', memberId);
            playable.play()
        })
        this.sceneManager = new SceneManager(canvasId, memberId, this.signalHub, serializedSpace)

        this.spaceChannel = this.socket.channel(`space:${serializedSpace.slug}`, { pos_rot: this.sceneManager.getMyPosRot() })
        this.sceneManager.setChannel(this.spaceChannel)

        window['channel'] = this.spaceChannel

        this.spaceChannel.onMessage = (event: string, payload: any) => {
            if (!event.startsWith('phx_') && !event.startsWith('chan_')) {
                this.signalHub.next({ event, payload })
            }
            return payload;
        }


        this.spaceChannel.on("server_lost", () => {
            window.location.href = '/';
        })


        window['orchestrator'] = this

        new App({ target: document.body, props: { canvasId: canvasId, webRTCClient: this.webRTCClient } });

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
        this.signalHub.pipe(
            skip(1), // first pos/rot may not be correct as we're still putting it in position, besides we'll send this during space_channel connect
            filter(msg => (msg.event === 'camera_moved')),
            throttleTime(100)
        ).subscribe(msg => {
            this.spaceChannel.push(msg.event, msg.payload)
            this.sceneManager.saveMyPosRot(msg.payload)
        })
    }


    async start() {



        this.sceneManager.createScene()
        // parse the scene for states

        this.sceneManager.run()

        // listen for clicked join button
        this.signalHub.pipe(
            filter(msg => (msg.event == 'joined'))
        ).subscribe(async () => {
            await this.joinSpace();
            this.forwardCameraMovement()
        })



    }
}
window.addEventListener('DOMContentLoaded', async () => {
    const serializedSpace = window['serializedSpace']
    const memberId = window['memberId']
    const orchestrator = new Orchestrator(signalHub, 'spaceCanvas', memberId, serializedSpace)
    orchestrator.start()
})


