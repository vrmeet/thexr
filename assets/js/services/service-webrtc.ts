/* eslint-disable no-prototype-builtins */
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
import { filter, take, Subject, scan } from "rxjs";

export class ServiceWebRTC implements IService {
  public name = "service-webrtc";
  public context: Context;
  public client: IAgoraRTCClient;
  public eventLoop = new Subject<"connect" | "disconnect">();
  public state = { joined: false, published_audio: false };
  // keep track of how many users in total have
  // we need at least 2 (so someone can hear)
  // and at least 1 of them has to be unmuted
  public micsMuted: Record<string, boolean> = {};
  public localTracks: {
    videoTrack: ILocalVideoTrack;
    audioTrack: IMicrophoneAudioTrack;
  } = {
    videoTrack: null,
    audioTrack: null,
  };
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

    // create a single event loop for connecting and disconnecting
    // so we can be idempotent, and avoid race conditions
    this.eventLoop.subscribe(async (val) => {
      console.log(val, this.state);
      if (val === "connect") {
        if (this.state.joined === false) {
          await this.join();
          this.state.joined = true;
        }
        if (
          this.state.joined === true &&
          this.state.published_audio === false &&
          !this.context.my_mic_muted
        ) {
          await this.publishAudio();
          this.state.published_audio = true;
        }
      } else if (val === "disconnect") {
        if (this.state.joined === true) {
          await this.leave();
          this.state.published_audio = false;
          this.state.joined = false;
        }
      }
      console.log("after", this.state);
    });

    // listen for mic_muted changes on everyone
    this.context.signalHub.incoming
      .on("components_upserted")
      .pipe(filter((evt) => evt.components.hasOwnProperty("mic_muted")))
      .subscribe((evt) => {
        this.micsMuted[evt.id] = evt.components.mic_muted;
        this.updateCountAndJoinOrUnjoin();
      });

    this.context.signalHub.incoming
      .on("entity_created")
      .pipe(filter((evt) => evt.components.hasOwnProperty("mic_muted")))
      .subscribe((evt) => {
        this.micsMuted[evt.id] = evt.components.mic_muted;
        this.updateCountAndJoinOrUnjoin();
      });

    this.context.signalHub.incoming.on("entities_deleted").subscribe((evt) => {
      evt.ids.forEach((id) => {
        delete this.micsMuted[id];
      });
      this.updateCountAndJoinOrUnjoin();
    });
  }

  numConnected() {
    return Object.keys(this.micsMuted).length;
  }

  numMicsOn() {
    return Object.values(this.micsMuted).filter((v) => v === false).length;
  }

  updateCountAndJoinOrUnjoin() {
    if (this.numConnected() > 1 && this.numMicsOn() > 0) {
      this.eventLoop.next("connect");
    } else {
      this.eventLoop.next("disconnect");
    }
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
