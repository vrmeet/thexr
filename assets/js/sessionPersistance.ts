
export const SESS_KEY_CAM_POSROT = 'camPosRot'
export const SESS_KEY_MIC_OPTIONS = 'micOption'
export const SESS_KEY_NICKNAME = 'nickname'

export class SessionPersistance {
    constructor() { }

    getCameraPosRot(): { pos: number[], rot: number[] } {
        return this.getAndParseKey(SESS_KEY_CAM_POSROT)
    }
    saveCameraPosRot(data: { pos: number[], rot: number[] }) {
        this.save(SESS_KEY_CAM_POSROT, data)
    }
    getNickname(): { nickname: string } {
        return this.getAndParseKey(SESS_KEY_NICKNAME, "localStorage")
    }
    saveNickname(data: { nickname: string }) {
        this.save(SESS_KEY_NICKNAME, data, "localStorage")
    }

    getMicAndOutputChoice(): { micDeviceId: string, outputDeviceId: string } | null {
        return this.getAndParseKey(SESS_KEY_MIC_OPTIONS)

    }
    saveMicAndOutputChoice(data: { micDeviceId: string, outputDeviceId: string }) {
        if (data.micDeviceId && data.outputDeviceId) {
            this.save(SESS_KEY_MIC_OPTIONS, data)
        }
    }
    getAndParseKey(key: string, storage = "sessionStorage") {
        try {
            const value = window[storage].getItem(key);
            if (value) {
                return JSON.parse(value)
            } else {
                return null
            }
        } catch (e) {
            console.error('tried to JSON.parse this value')
        }
    }

    save(key: string, value: any, storage = "sessionStorage") {
        window[storage].setItem(key, JSON.stringify(value))
    }
}

export const sessionPersistance = new SessionPersistance()