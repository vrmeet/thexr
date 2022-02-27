import { Emitter } from 'typed-rx-emitter'

type Events = {
    joined: any
    camera_ready: any
    controller_ready: { hand: string }
    hand_movement: { hand: string, pos: number[], rot: number[] }
    xr_component_changed: {
        hand: string,
        pressed: boolean,
        touched: boolean,
        value: number,
        id: string
    }
    camera_moved: { pos: number[], rot: number[] }
    xr_state_changed: BABYLON.WebXRState
    spaces_api: { func: string, args: any[] }
    menu_action: { name: string, payload: any }
    editing: boolean,
    new_log: any


}

export const signalHub = new Emitter<Events>()


// import { Subject } from "rxjs";
// import { filter } from 'rxjs/operators'
// import type { SignalEvent } from "./types";

// export const signalHub = new Subject<SignalEvent>();

// export const listen = (event: string) => {
//     return signalHub.pipe(
//         filter(msg => (msg.event === event))
//     )
// }

// class SigEvent {
//     constructor(public event: string, public payload: any) {

//     }
// }
// type primativeType = "box" | "cone"
// class EventEntityCreated extends SigEvent {

//     constructor(type: primativeType) {
//         super("entity_created", { type })
//     }
// }
// export class EventJoined extends SigEvent {
//     constructor() {
//         super("joined", {})
//     }
// }

window['signalHub'] = signalHub;