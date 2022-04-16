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

export type MenuEvents = {
    menu_opened: boolean
    menu_topic: string
    menu_editing_tool: types.EditMode
}

export type MovementEvents = {
    camera_moved: types.PosRot
    hand_movement: { hand: string, pos: number[], rot: number[] }
}


interface SignalHub {
    local: Emitter<LocalEvents>
    incoming: Emitter<IncomingEvents>
    outgoing: Emitter<OutgoingEvents>
    menu: Emitter<MenuEvents>
    movement: Emitter<MovementEvents>
}

export const signalHub: SignalHub = {
    local: new Emitter<LocalEvents>(),
    incoming: new Emitter<IncomingEvents>(),
    outgoing: new Emitter<OutgoingEvents>(),
    menu: new Emitter<MenuEvents>(),
    movement: new Emitter<MovementEvents>()
}


window['signalHub'] = signalHub;