import { Emitter } from 'typed-rx-emitter'

type Events = {
    joined: any // user clicked join button
    space_channel_connected: { agora_app_id: string }
    camera_ready: { pos: number[], rot: number[] }
    controller_ready: { hand: string }
    hand_movement: { hand: string, pos: number[], rot: number[] }
    xr_component_changed: {
        hand: string,
        pressed: boolean,
        touched: boolean,
        value: number,
        id: string
    }
    camera_moved: { pos: number[], rot: number[] }
    xr_state_changed: BABYLON.WebXRState
    spaces_api: { func: string, args: any[] }
    menu_action: { name: string, payload?: any }
    editing: boolean,
    new_log: any,
    mic: "on" | "off",
    // video: "screen" | "camera" | "off"


}

export const signalHub = new Emitter<Events>()

window['signalHub'] = signalHub;