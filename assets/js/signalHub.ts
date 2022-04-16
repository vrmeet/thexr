import { BehaviorSubject, bufferCount, filter, map, Observable, scan, Subject, tap } from 'rxjs'
import { Emitter } from 'typed-rx-emitter'
import type * as types from './types'

type LocalEvents = {
    client_ready: 'enter' | 'observe'
    space_channel_connected: { agora_app_id: string }
    camera_ready: { pos: number[], rot: number[] }
    controller_ready: { hand: string }
    xr_component_changed: {
        hand: string,
        pressed: boolean,
        touched: boolean,
        value: number,
        id: string
    }
    xr_state_changed: BABYLON.WebXRState
    new_log: any,
    mesh_built: { name: string } // required to add new meshes to teleport manager
    member_states_changed: { [member_id: string]: types.member_state }
}

export type IncomingEvents = {
    event: types.event
    presence_diff: types.PresenceDiff
    presence_state: types.PresenceState
    space_settings_changed: types.scene_settings
    server_lost: any
    about_members: { movements: { [member_id: string]: { pos_rot: types.PosRot } }, states: { [member_id: string]: types.member_state } }
}

export type OutgoingEvents = {
    event: types.event
}


interface SignalHub {
    observables: {
        //    memberStates?: Observable<{ [member_id: string]: types.member_state }>
        camera_moved: Subject<{ pos: number[], rot: number[] }>
        hand_movement: Subject<{ hand: string, pos: number[], rot: number[] }>
        menu_opened: BehaviorSubject<boolean>
        editing: BehaviorSubject<types.EditMode>
        menu_page: BehaviorSubject<string>


    }
    local: Emitter<LocalEvents>
    incoming: Emitter<IncomingEvents>
    outgoing: Emitter<OutgoingEvents>
}

export const signalHub: SignalHub = {
    observables: {
        camera_moved: new Subject<{ pos: number[], rot: number[] }>(),
        hand_movement: new Subject<{ hand: string, pos: number[], rot: number[] }>(),
        menu_opened: new BehaviorSubject<boolean>(false),
        editing: new BehaviorSubject<types.EditMode>(null),
        menu_page: new BehaviorSubject<string>("main"),

    },
    local: new Emitter<LocalEvents>(),
    incoming: new Emitter<IncomingEvents>(),
    outgoing: new Emitter<OutgoingEvents>()
}


window['signalHub'] = signalHub;