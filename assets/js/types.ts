
export type scene_settings = {
    use_skybox: boolean
    skybox_inclination: number
    clear_color: string
    fog_color: string
    fog_density: number
}

export type serialized_space = { settings: scene_settings, slug: string, entities: any[] }

export interface member_state {
    mic_pref?: "on" | "off"
    video_pref?: "screen" | "camera" | "off"
    audio_actual?: { volume: number } | "unpublished" | { error: string }
    video_actual?: "published" | "unpublished" | { error: string } | "forced_mute"
    nickname?: string
    handraised?: boolean
    updated_at?: number
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

/**
 * commands
 */

export type command =
    ["enter", { member_id: string }] |
    ["observe", { member_id: string }] |
    ["leave", { member_id: string }] |
    ["move", { member_id: string, pos_rot: PosRot }]




/**
 * events
 */

export type event =
    { m: "member_entered", p: { member_id: string, pos_rot: PosRot }, ts?: number } |
    { m: "member_observed", p: { member_id: string }, ts?: number }
    // ["member_left", { member_id: string }] |
    // ["member_moved", { member_id: string, pos_rot: PosRot }]


