/* eslint-disable no-prototype-builtins */
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
import type { ISystem } from "../system";
import type { Context } from "../context";
import type { XRS } from "../xrs";

export class SystemWebRTC implements ISystem {
  public name = "webrtc";
  public order = 10;
  public xrs: XRS;
  public context: Context;
  public client: IAgoraRTCClient;
  public verification = new Subject<"be_connected" | "be_disconnected">();
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

  setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
    this.options.channel = this.context.webrtc_channel_id;
    this.options.uid = this.context.my_member_id;

    // currently we get app id when we join channel
    this.context.signalHub.local
      .on("space_channel_connected")
      .pipe(take(1))
      .subscribe((resp) => {
        this.options.appid = resp.agora_app_id;
      });
    // AgoraRTC.setLogLevel(0);
    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    this.client.on("exception", (event) => {
      console.warn(event);
    });

    this.client.on("user-published", (user, mediaType) => {
      this.subscribeRemoteUser(user, mediaType);
    });
    this.client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "video") {
        this.destroyVideoPlayerContainer(user);
      }
    });

    AgoraRTC.enableLogUpload();

    // create a single event loop for connecting and disconnecting
    // so we can be idempotent, and avoid race conditions
    this.verification.subscribe(async (val) => {
      if (val === "be_connected") {
        if (this.state.joined === false) {
          await this.join();
          this.state.joined = true;
        }
        // if we're unmuted and not yet publishing audio, we should publish
        if (!this.state.published_audio && !this.context.my_mic_muted) {
          await this.publishAudio();
          this.state.published_audio = true;
        }
        // if we're muted, but publishing audio, we should unpublish it
        else if (this.context.my_mic_muted && this.state.published_audio) {
          await this.unpublishAudio();
          this.state.published_audio = false;
        }
      } else if (val === "be_disconnected") {
        if (this.state.joined === true) {
          await this.leave();
          this.state.published_audio = false;
          this.state.joined = false;
        }
      }
    });

    // this system observes attendance, but isn't called by synergizer since system name isn't a component
    this.context.signalHub.incoming
      .on("entity_created")
      .pipe(
        filter((msg) => msg.components?.attendance?.mic_muted !== undefined)
      )
      .subscribe((msg) => {
        this.micsMuted[msg.id] = msg.components.attendance.mic_muted;
        this.updateCountAndJoinOrUnjoin();
      });

    this.context.signalHub.incoming
      .on("components_upserted")
      .pipe(
        filter(
          (msg) =>
            msg.components?.attendance?.mic_muted !== undefined &&
            this.micsMuted[msg.id] !== undefined
        )
      )
      .subscribe((msg) => {
        this.micsMuted[msg.id] = msg.components.attendance.mic_muted;
        this.updateCountAndJoinOrUnjoin();
      });

    this.context.signalHub.incoming
      .on("entities_deleted")
      .subscribe(({ ids }) => {
        ids.forEach((id) => {
          if (this.micsMuted[id] !== undefined) {
            delete this.micsMuted[id];
          }
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
    if (this.numConnected() >= 2 && this.numMicsOn() >= 1) {
      this.verification.next("be_connected");
    } else {
      this.verification.next("be_disconnected");
    }
  }

  async join() {
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
    this.client.publish(this.localTracks.audioTrack);
  }
  async unpublishAudio() {
    if (!this.localTracks.audioTrack) {
      return;
    }
    await this.client.unpublish([this.localTracks.audioTrack]);
    this.localTracks.audioTrack.stop();
    this.localTracks.audioTrack.close();
    this.localTracks.audioTrack = null;
  }

  async subscribeRemoteUser(
    user: IAgoraRTCRemoteUser,
    mediaType: "audio" | "video"
  ) {
    // subscribe to a remote user
    try {
      await this.client.subscribe(user, mediaType);
      if (mediaType === "video") {
        // need to create a video container
        const playerContainer = this.createVideoPlayerContainer(user);
        user.videoTrack.play(playerContainer);
      }
      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    } catch (e) {
      console.error(e);
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
