import type { EventName } from "./event-names"

export type scene_settings = {
    use_skybox: boolean
    skybox_inclination: number
    clear_color: string
    fog_color: string
    fog_density: number
}

export type serialized_space = { settings: scene_settings, id: string, entities: any[] }

export type xr_component = {
    pressed: boolean,
    touched: boolean,
    value: number,
    axes: { x: number, y: number },
    id: string
}

export interface member_state {
    mic_muted?: boolean
    nickname?: string
}

export type PosRot = {
    pos: number[],
    rot: number[]
}

export type PresenceState = {
    [member_id: string]: { metas: any }
}

export type PresenceDiff = {
    joins: PresenceState,
    leaves: PresenceState
}

export type EditMode = "transform" | "delete" | null

export type Component =
    { type: "position", data: { value: number[] } } |
    { type: "rotation", data: { value: number[] } } |
    { type: "scaling", data: { value: number[] } } |
    { type: "color", data: { value: string } }


/**
 * events
 */

export type event =
    { m: EventName.member_changed_mic_pref, p: { member_id: string, mic_muted: boolean }, ts?: number } |
    { m: EventName.member_changed_nickname, p: { member_id: string, nickname: string }, ts?: number } |
    { m: EventName.member_entered, p: { member_id: string, pos_rot: PosRot, state: member_state }, ts?: number } |
    { m: EventName.member_observed, p: { member_id: string }, ts?: number } |
    { m: EventName.member_moved, p: { member_id: string, pos_rot: PosRot, left?: PosRot, right?: PosRot }, ts?: number } |
    { m: EventName.member_left, p: { member_id: string }, ts?: number } |
    { m: EventName.entity_created, p: { type: string, id: string, name: string, components: Component[] }, ts?: number } |
    { m: EventName.entity_transformed, p: { id: string, components: Component[] }, ts?: number } |
    { m: EventName.entity_colored, p: { id: string, color: string }, ts?: number } |
    { m: EventName.entity_deleted, p: { id: string }, ts?: number } |
    { m: EventName.entity_grabbed, p: { member_id: string, entity_id: string, hand: string, hand_pos_rot: PosRot, entity_pos_rot: PosRot } } |
    { m: EventName.entity_released, p: { member_id: string, entity_id: string, hand: string, hand_pos_rot: PosRot, entity_pos_rot: PosRot, lv?: number[], av?: number[] } } |
    { m: EventName.entity_trigger_squeezed, p: { member_id: string, entity_id: string, pos: number[], direction: number[] } } |
    { m: EventName.member_damaged, p: { member_id: string } } |
    { m: EventName.hud_message_broadcasted, p: { member_id: string, msg: string } } |
    { m: EventName.agent_spawned, p: { name: string, position: number[] } } |
    { m: EventName.agent_directed, p: { name: string, current_position: number[], next_position: number[] } } |
    { m: EventName.target_hit, p: { entity_id: string, pos: number[], direction: number[] } }

    // { m: EventName.agent_path_planned, p: { agent_id: string, pos_rot: PosRot } } |
    // { m: EventName.agent_removed, p: { agent_id: string } }
    // ["member_left", { member_id: string }] |
    // ["member_moved", { member_id: string, pos_rot: PosRot }]


