import { BehaviorSubject, bufferCount, filter, map, Observable, scan, Subject, tap } from 'rxjs'
import { Emitter } from 'typed-rx-emitter'
import type * as types from './types'

type LocalEvents = {
    joined: any // user clicked join button
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
    member_state: { member_id: string, op: "new" | "updated" | "removed", state: types.member_state }
    mesh_built: { name: string }
}

export type IncomingEvents = {
    member_moved: { member_id: string, pos: number[], rot: number[] }
    component_changed: { entity_id: string, type: string, data: any }
    entity_created: any
    entity_deleted: { id: string }
    presence_diff: types.PresenceDiff
    presence_state: types.PresenceState
    space_settings_changed: types.scene_settings
    server_lost: any
    new_member: { member_id: string, pos_rot: types.PosRot, state: types.member_state }
    members: { movements: { [member_id: string]: { pos_rot: types.PosRot } }, states: { [member_id: string]: types.member_state } }
    member_state_updated: { member_id: string, state: types.member_state }

}

export type OutgoingEvents = {
    member_state_patched: types.member_state
    member_state_changed: types.member_state
    spaces_api: { func: string, args: any[] }
}


interface SignalHub {
    observables: {
        mic_muted_pref: BehaviorSubject<boolean>
        //    memberStates?: Observable<{ [member_id: string]: types.member_state }>
        camera_moved: Subject<{ pos: number[], rot: number[] }>
        hand_movement: Subject<{ hand: string, pos: number[], rot: number[] }>
        menu_opened: BehaviorSubject<boolean>
        editing: BehaviorSubject<boolean>
        menu_page: BehaviorSubject<string>


    }
    local: Emitter<LocalEvents>
    incoming: Emitter<IncomingEvents>
    outgoing: Emitter<OutgoingEvents>
}

export const signalHub: SignalHub = {
    observables: {
        mic_muted_pref: new BehaviorSubject<boolean>(true),
        camera_moved: new Subject<{ pos: number[], rot: number[] }>(),
        hand_movement: new Subject<{ hand: string, pos: number[], rot: number[] }>(),
        menu_opened: new BehaviorSubject<boolean>(false),
        editing: new BehaviorSubject<boolean>(false),
        menu_page: new BehaviorSubject<string>("main"),

    },
    local: new Emitter<LocalEvents>(),
    incoming: new Emitter<IncomingEvents>(),
    outgoing: new Emitter<OutgoingEvents>()
}


window['signalHub'] = signalHub;