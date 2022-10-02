import type { Context } from "../context";
import type { IService } from "./service";
import AgoraRTC from "agora-rtc-sdk-ng";
import type {
  ConnectionState,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";

export class ServiceWebRTC implements IService {
  name: "service-webrtc";
  init(context: Context) {}
  join() {}
  leave() {}
  publishAudio() {}
  unpublishAudio() {}
  handleRemotePublishedAudio() {}
  handleRemoteUnpublishedAudio() {}
}
