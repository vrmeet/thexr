
export type SceneSettings = {
    use_skybox: boolean
    skybox_inclination: number
    clear_color: string
    fog_color: string
    fog_density: number
}

export type SignalEvent = {
    event: string
    payload: any
}
