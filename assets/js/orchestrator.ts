
/// <reference types="svelte" />

import { SceneManager } from './sceneManager'
import App from "./App.svelte";
import { SpaceBroker } from './space-broker';

import type { scene_settings, serialized_space } from './types'
import { WebRTCManager } from './web-rtc-manager';
import { MemberStates } from './member-states';
import { RecastJSCrowd } from 'babylonjs';
import { signalHub } from './signalHub';


export class Orchestrator {
    public canvas;
    public engine;
    public space_id: string
    public entities: any[]
    public settings: scene_settings
    public skyBox: BABYLON.Mesh
    public sceneManager: SceneManager
    public spaceBroker: SpaceBroker
    public webRTCManager: WebRTCManager
    public memberStates: MemberStates



    constructor(public canvasId: string, public member_id: string, public serializedSpace: serialized_space) {
        this.space_id = serializedSpace.id;
        this.memberStates = new MemberStates(this)
        this.spaceBroker = new SpaceBroker(this)

        this.sceneManager = new SceneManager(this)
        this.webRTCManager = new WebRTCManager(this)

        window['orchestrator'] = this

        new App({ target: document.body, props: { orchestrator: this } });

    }





    async start() {
        await this.sceneManager.createScene()
        // parse the scene for states

        this.sceneManager.run()

    }






}


window.addEventListener('DOMContentLoaded', async () => {
    console.log("about to await Recast")
    await window['Recast']()
    const serializedSpace = window['serializedSpace']
    const member_id = window['member_id']
    const orchestrator = new Orchestrator('spaceCanvas', member_id, serializedSpace)
    orchestrator.start()
    window.onerror = function (message, source, lineno, colno, error) {
        signalHub.local.emit("hud_msg", JSON.stringify({ message, source, lineno, colno, error }));
        throw error;
    };
})


