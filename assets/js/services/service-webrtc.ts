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
import { take } from "rxjs";

export class ServiceWebRTC implements IService {
  name: "service-webrtc";
  public context: Context;
  client: IAgoraRTCClient;
  localTracks: {
    videoTrack: ILocalVideoTrack;
    audioTrack: IMicrophoneAudioTrack;
  } = {
    videoTrack: null,
    audioTrack: null,
  };
  remoteUsers: Record<string, IAgoraRTCRemoteUser> = {};
  // Agora client options
  options = {
    appid: null,
    channel: null,
    uid: null,
    token: null,
  };

  init(context: Context) {
    this.context = context;
    this.options.channel = this.context.webrtc_channel_id;
    this.options.uid = this.context.my_member_id;
    this.context.signalHub.local
      .on("space_channel_connected")
      .pipe(take(1))
      .subscribe((resp) => {
        this.options.appid = resp.agora_app_id;
      });
    AgoraRTC.setLogLevel(0);
    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    AgoraRTC.enableLogUpload();
  }
  async join() {
    this.client.on("exception", (event) => {
      console.warn(event);
    });
    this.client.on("user-published", this.handleRemotePublished);
    this.client.on("user-unpublished", this.handleRemoteUnpublished);

    this.options.uid = await this.client.join(
      this.options.appid,
      this.options.channel,
      this.options.token,
      this.options.uid
    );
  }
  async leave() {
    this.localTracks.audioTrack?.stop();
    this.localTracks.audioTrack?.close();
    this.localTracks.videoTrack?.stop();
    this.localTracks.videoTrack?.close();

    this.localTracks = {
      videoTrack: null,
      audioTrack: null,
    };

    await this.client.leave();
  }
  async publishAudio() {
    this.localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  }
  async unpublishAudio() {
    if (!this.localTracks.audioTrack) {
      console.warn("not currently publishing audio");
      return;
    }
    await this.client.unpublish([this.localTracks.audioTrack]);
    this.localTracks.audioTrack.stop();
    this.localTracks.audioTrack.close();
    this.localTracks.audioTrack = null;
  }
  handleRemotePublished(
    user: IAgoraRTCRemoteUser,
    mediaType: "audio" | "video"
  ) {
    this.subscribe(user, mediaType);
  }
  handleRemoteUnpublished(
    user: IAgoraRTCRemoteUser,
    mediaType: "audio" | "video"
  ) {
    if (mediaType === "video") {
      this.destroyVideoPlayerContainer(user);
    }
  }

  async subscribe(user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") {
    // subscribe to a remote user
    await this.client.subscribe(user, mediaType);
    console.log("subscribe success");
    if (mediaType === "video") {
      // need to create a video container
      const playerContainer = this.createVideoPlayerContainer(user);
      user.videoTrack.play(playerContainer);
    }
    if (mediaType === "audio") {
      user.audioTrack.play();
    }
  }

  destroyVideoPlayerContainer(otherMember: IAgoraRTCRemoteUser) {
    const theID = "agoraVideo_" + otherMember.uid;
    const playerContainer = document.getElementById(theID);
    if (playerContainer) {
      playerContainer.remove();
    }
  }

  createVideoPlayerContainer(otherMember: IAgoraRTCRemoteUser) {
    // in case it exists (some defensive programming)
    this.destroyVideoPlayerContainer(otherMember);

    const playerContainer = document.createElement("div");
    // Specify the ID of the DIV container. You can use the `uid` of the remote user.
    playerContainer.id = "agoraVideo_" + otherMember.uid.toString();
    playerContainer.style.width = "640px";
    playerContainer.style.height = "480px";

    document.body.append(playerContainer);

    return playerContainer;
  }
}
