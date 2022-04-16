
export type scene_settings = {
    use_skybox: boolean
    skybox_inclination: number
    clear_color: string
    fog_color: string
    fog_density: number
}

export type serialized_space = { settings: scene_settings, id: string, entities: any[] }

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
    { m: "member_changed_mic_pref", p: { member_id: string, mic_muted: boolean }, ts?: number } |
    { m: "member_changed_nickname", p: { member_id: string, nickname: string }, ts?: number } |
    { m: "member_entered", p: { member_id: string, pos_rot: PosRot, state: member_state }, ts?: number } |
    { m: "member_observed", p: { member_id: string }, ts?: number } |
    { m: "member_moved", p: { member_id: string, pos_rot: PosRot }, ts?: number } |
    { m: "member_left", p: { member_id: string }, ts?: number } |
    { m: "entity_created", p: { type: string, id: string, name: string, components: Component[] }, ts?: number } |
    { m: "entity_transformed", p: { id: string, components: Component[] }, ts?: number } |
    { m: "entity_colored", p: { id: string, color: string }, ts?: number } |
    { m: "entity_deleted", p: { id: string }, ts?: number }
    // ["member_left", { member_id: string }] |
    // ["member_moved", { member_id: string, pos_rot: PosRot }]


