
/// <reference types="svelte" />

import { SceneManager } from './sceneManager'
import App from "./App.svelte";
import { SpaceBroker } from './space-broker';

import type { scene_settings, serialized_space } from './types'
import { WebRTCManager } from './web-rtc-manager';
import { member_states } from './member-states';
import { signalHub } from './signalHub';


export class Orchestrator {

    public space_id: string
    public entities: any[]
    public settings: scene_settings
    public skyBox: BABYLON.Mesh
    public sceneManager: SceneManager
    public spaceBroker: SpaceBroker
    public webRTCManager: WebRTCManager



    constructor(public member_id: string, public serializedSpace: serialized_space) {
        this.space_id = serializedSpace.id;
        member_states.initializeSelf(member_id)
        this.spaceBroker = new SpaceBroker(member_id, this.space_id)

        this.sceneManager = new SceneManager(member_id, serializedSpace)
        this.webRTCManager = new WebRTCManager(member_id, this.space_id)

        window['orchestrator'] = this

        new App({
            target: document.body,
            props: { space_id: this.space_id, member_id: this.member_id }
        });

    }





    async start() {
        await this.sceneManager.createScene()
        // parse the scene for states

        this.sceneManager.run()

    }


    debug() {
        this.sceneManager.scene.debugLayer.show({ embedMode: true })
    }





}


window.addEventListener('DOMContentLoaded', async () => {
    console.log("about to await Recast")
    await window['Recast']()
    const serializedSpace = window['serializedSpace']
    const member_id = window['member_id']
    const orchestrator = new Orchestrator(member_id, serializedSpace)
    orchestrator.start()
    window.onerror = function (message, source, lineno, colno, error) {
        try {
            // catch errors and display them to self
            const line = JSON.stringify({ message, source, lineno, colno, error })
            const size = 50
            const numChunks = Math.ceil(line.length / size)
            const chunks = new Array(numChunks)

            for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
                chunks[i] = line.substr(o, size)
            }
            chunks.forEach(chunk => {
                signalHub.local.emit("hud_msg", chunk);
            })

        } catch (e) {

        }
        if (window['Honeybadger']) {
            window['Honeybadger'].notify(error)
        }
    };
})


