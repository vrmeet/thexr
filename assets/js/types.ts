
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


