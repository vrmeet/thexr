export const SESS_KEY_CAM_POSROT = "camPosRot";
export const SESS_KEY_MIC_OPTIONS = "micOption";
export const SESS_KEY_NICKNAME = "nickname";

export function getCameraPosRot(space_id: string): {
  pos: number[];
  rot: number[];
} {
  return getAndParseKey(SESS_KEY_CAM_POSROT + space_id);
}

export function saveCameraPosRot(
  space_id: string,
  data: { pos: number[]; rot: number[] }
) {
  save(SESS_KEY_CAM_POSROT + space_id, data);
}
export function getNickname(): { nickname: string } {
  return getAndParseKey(SESS_KEY_NICKNAME, "localStorage");
}
export function saveNickname(data: { nickname: string }) {
  save(SESS_KEY_NICKNAME, data, "localStorage");
}
export function getMicAndOutputChoice(): {
  micDeviceId: string;
  outputDeviceId: string;
} | null {
  return getAndParseKey(SESS_KEY_MIC_OPTIONS);
}
export function saveMicAndOutputChoice(data: {
  micDeviceId: string;
  outputDeviceId: string;
}) {
  // if (data.micDeviceId && data.outputDeviceId) {
  save(SESS_KEY_MIC_OPTIONS, data);
  // }
}
export function getAndParseKey(key: string, storage = "sessionStorage") {
  try {
    const value = window[storage].getItem(key);
    if (value) {
      return JSON.parse(value);
    } else {
      return null;
    }
  } catch (e) {
    console.error("tried to JSON.parse this value");
  }
}

export function save(key: string, value: any, storage = "sessionStorage") {
  window[storage].setItem(key, JSON.stringify(value));
}
