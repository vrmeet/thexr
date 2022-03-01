
export const SESS_KEY_CAM_POSROT = 'camPosRot'
export const SESS_KEY_MIC_OPTIONS = 'micOption'

export class SessionPersistance {
    constructor() { }

    getCameraPosRot(): { pos: number[], rot: number[] } {
        return this.getAndParseKey(SESS_KEY_CAM_POSROT)
    }
    saveCameraPosRot(data: { pos: number[], rot: number[] }) {
        this.save(SESS_KEY_CAM_POSROT, data)
    }
    getMicAndOutputChoice(): { micDeviceId: string, outputDeviceId: string } | null {
        return this.getAndParseKey(SESS_KEY_MIC_OPTIONS)

    }
    saveMicAndOutputChoice(data: { micDeviceId: string, outputDeviceId: string }) {
        if (data.micDeviceId && data.outputDeviceId) {
            this.save(SESS_KEY_MIC_OPTIONS, data)
        }
    }
    getAndParseKey(key: string) {
        try {
            const value = window.sessionStorage.getItem(key);
            if (value) {
                return JSON.parse(value)
            } else {
                return null
            }
        } catch (e) {
            console.log('tried to JSON.parse this value',)
        }
    }

    save(key: string, value: any) {
        window.sessionStorage.setItem(key, JSON.stringify(value))
    }
}

export const sessionPersistance = new SessionPersistance()