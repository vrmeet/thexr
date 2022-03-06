import { BehaviorSubject, Observable, scan, Subject } from 'rxjs'
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
    spaces_api: { func: string, args: any[] }
    menu_action: { name: string, payload?: any }
    editing: boolean,
    new_log: any,
    member_state: { member_id: string, op: "new" | "updated" | "removed", state: types.member_state }

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
    member_state_updated: { member_id: string, new_state: types.member_state }

}

export type OutgoingEvents = {
    member_state_changed: types.member_state
}


interface SignalHub {
    observables: {
        mic_muted_pref: BehaviorSubject<boolean>
        memberStates?: Observable<{ [member_id: string]: types.member_state }>
        camera_moved: Subject<{ pos: number[], rot: number[] }>
        hand_movement: Subject<{ hand: string, pos: number[], rot: number[] }>
    }
    local: Emitter<LocalEvents>
    incoming: Emitter<IncomingEvents>
    outgoing: Emitter<OutgoingEvents>
}

export const signalHub: SignalHub = {
    observables: {
        mic_muted_pref: new BehaviorSubject<boolean>(true),
        camera_moved: new Subject<{ pos: number[], rot: number[] }>(),
        hand_movement: new Subject<{ hand: string, pos: number[], rot: number[] }>()
    },
    local: new Emitter<LocalEvents>(),
    incoming: new Emitter<IncomingEvents>(),
    outgoing: new Emitter<OutgoingEvents>()
}

// transforming incoming into local

signalHub.incoming.on('new_member').subscribe(({ member_id, state }) => {
    signalHub.local.emit('member_state', { member_id, state, op: "new" })
})
signalHub.incoming.on('members').subscribe(({ states, movements }) => {
    Object.entries(states).forEach(([member_id, state]) => {
        signalHub.local.emit('member_state', { member_id, state, op: "new" })
    })
})
signalHub.incoming.on('member_state_updated').subscribe(({ member_id, new_state }) => {
    signalHub.local.emit('member_state', { member_id, state: new_state, op: "updated" })
})
signalHub.incoming.on('presence_diff').subscribe(presence_diff => {
    Object.entries(presence_diff.leaves).forEach(([member_id, _meta]) => {
        signalHub.local.emit('member_state', { member_id, state: null, op: "removed" })
    })
})

signalHub.local.on('member_state').subscribe(m => {
    console.log('member_state', m)
})


signalHub.observables.memberStates = signalHub.local.on('member_state').pipe(
    scan((acc, { member_id, op, state }) => {
        if (op === 'removed') {
            delete acc[member_id]
        } else {
            acc[member_id] = state
        }
        return acc;
    }, {})
)






window['signalHub'] = signalHub;