
export type SceneSettings = {
    use_skybox: boolean
    skybox_inclination: number
    clear_color: string
    fog_color: string
    fog_density: number
}

export type SerializedSpace = { settings: SceneSettings, slug: string, entities: any[] }

export type MemberState =
    {
        micPref: "on" | "off"
        videoPref: "screen" | "camera" | "off"
        audioActual: { volume: number } | "unpublished" | { error: string }
        videoActual: "published" | "unpublished" | { error: string }
        nickname: string
        handraised: boolean
    }

export type PosRot = {
    pos: number[],
    rot: number[]
}

export interface PresenceMeta {
    phx_ref: string
    pos_rot: PosRot
    state: MemberState
}
// {"SvKXtc":{"metas":[{"phx_ref":"FtfKtCZDEAA7IQTD","pos_rot":{"pos":[0,1.7,-8],"rot":[-0.06444,0.06164,0.00399,0.99601]}}]}}
export type PresenceState = {
    [memberId: string]: { metas: PresenceMeta[] }
}


//presence_diff {"joins":{"SvKXtc":{"metas":[{"phx_ref":"FtfKtCZDEAA7IQTD","pos_rot":{"pos":[0,1.7,-8],"rot":[-0.06444,0.06164,0.00399,0.99601]}}]}},"leaves":{}}
export type PresenceDiff = {
    joins: PresenceState,
    leaves: PresenceState
}


