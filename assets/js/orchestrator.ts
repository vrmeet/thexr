
import { filter, throttleTime, skip } from 'rxjs/operators'
import { WebRTCClientAgora } from './web-rtc-client-agora';
import { signalHub } from './signalHub'
import { SceneManager } from './sceneManager'
import App from "./App.svelte";
import { LogManager } from './log-manager';
import { SpaceBroker } from './space-broker';

import type { SceneSettings, SerializedSpace } from './types'
import { MemberManager } from './member-manager';

export class Orchestrator {
    public canvas;
    public engine;
    public slug: string
    public entities: any[]
    public settings: SceneSettings
    public skyBox: BABYLON.Mesh
    public sceneManager: SceneManager
    public logManager: LogManager
    public spaceBroker: SpaceBroker
    public memberManager: MemberManager



    constructor(public canvasId: string, public memberId: string, public serializedSpace: SerializedSpace) {
        this.logManager = new LogManager()
        this.slug = serializedSpace.slug;
        this.spaceBroker = new SpaceBroker(this)

        this.sceneManager = new SceneManager(this)
        this.memberManager = new MemberManager(this)

        //  this.sceneManager.setChannel(this.spaceChannel)


        // this.spaceChannel.onMessage = (event: string, payload: any) => {
        //     if (!event.startsWith('phx_') && !event.startsWith('chan_')) {
        //         signalHub.next({ event, payload })
        //         signalHub.emit(event, payload)
        //     }
        //     return payload;
        // }


        // this.spaceChannel.on("server_lost", () => {
        //     window.location.href = '/';
        // })



        window['orchestrator'] = this

        new App({ target: document.body, props: { canvasId, slug: this.slug } });

    }


    // joinSpace(): Promise<any> {
    //     return new Promise((resolve, reject) => {
    //         this.socket.connect()
    //         this.spaceChannel.join()
    //             .receive('ok', resp => {
    //                 this.webRTCClient.join(resp.agora_app_id)
    //                 window['webRTCClient'] = this.webRTCClient;
    //                 console.log('Joined successfully')
    //                 resolve(resp)
    //             })
    //             .receive('error', resp => {
    //                 console.log('Unable to join', resp)
    //                 reject(resp)
    //             })

    //     })

    // }


    // forwardCameraMovement() {
    //     // forward camera movement
    //     signalHub.on('camera_moved').pipe(
    //         throttleTime(100)
    //     ).subscribe(msg => {
    //         this.spaceChannel.push('camera_moved', msg)
    //         // TODO, do this once when page is being unloaded?
    //         // sessionPersistance.saveCameraPosRot(msg)
    //     })
    // }


    async start() {
        this.sceneManager.createScene()
        // parse the scene for states

        this.sceneManager.run()

        // listen for clicked join button
        // signalHub.on('joined').subscribe(async () => {
        //     console.log('joined')
        //     await this.joinSpace();
        //     this.forwardCameraMovement()
        //     addEventListener("beforeunload", () => {
        //         let cam = this.sceneManager.scene.activeCamera
        //         let pos = cam.position.asArray().map(reduceSigFigs)
        //         let rot = cam.absoluteRotation.asArray().map(reduceSigFigs)
        //         sessionPersistance.saveCameraPosRot({ pos, rot })
        //     }, { capture: true });
    }

    // signalHub.pipe(
    //     filter(msg => (msg.event == 'joined'))
    // ).subscribe(async () => {
    //     await this.joinSpace();
    //     this.forwardCameraMovement()
    // })

    // forward space_api to the channel
    // signalHub.on('spaces_api').subscribe(payload => {
    // this.spaceChannel.push('spaces_api', payload)
    // })

    // signalHub.pipe(
    //     filter(msg => (msg.event == "spaces_api"))
    // ).subscribe(msg => {
    //     this.spaceChannel.push(msg.event, msg.payload)
    // })




}


window.addEventListener('DOMContentLoaded', async () => {
    const serializedSpace = window['serializedSpace']
    const memberId = window['memberId']
    const orchestrator = new Orchestrator('spaceCanvas', memberId, serializedSpace)
    orchestrator.start()

})


