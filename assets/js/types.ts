import type { Subject } from 'rxjs'
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

export type SignalHub = Subject<SignalEvent>

export type SerializedSpace = { settings: SceneSettings, slug: string, entities: any[] }

