
/// <reference types="svelte" />

import { SceneManager } from './sceneManager'
import App from "./App.svelte";
import { LogManager } from './log-manager';
import { SpaceBroker } from './space-broker';

import type { scene_settings, serialized_space } from './types'
import { WebRTCManager } from './web-rtc-manager';
import { MemberStates } from './member-states';

export class Orchestrator {
    public canvas;
    public engine;
    public space_id: string
    public entities: any[]
    public settings: scene_settings
    public skyBox: BABYLON.Mesh
    public sceneManager: SceneManager
    public logManager: LogManager
    public spaceBroker: SpaceBroker
    public webRTCManager: WebRTCManager
    public memberStates: MemberStates



    constructor(public canvasId: string, public member_id: string, public serializedSpace: serialized_space) {
        this.logManager = new LogManager()
        this.space_id = serializedSpace.id;
        this.memberStates = new MemberStates(this)
        this.spaceBroker = new SpaceBroker(this)

        this.sceneManager = new SceneManager(this)
        this.webRTCManager = new WebRTCManager(this)

        window['orchestrator'] = this

        new App({ target: document.body, props: { orchestrator: this } });

    }





    async start() {
        this.sceneManager.createScene()
        // parse the scene for states

        this.sceneManager.run()

    }






}


window.addEventListener('DOMContentLoaded', async () => {
    const serializedSpace = window['serializedSpace']
    const member_id = window['member_id']
    const orchestrator = new Orchestrator('spaceCanvas', member_id, serializedSpace)
    orchestrator.start()

})


