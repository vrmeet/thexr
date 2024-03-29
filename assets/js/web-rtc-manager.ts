import { map, take, distinctUntilChanged, tap } from "rxjs/operators";

import { signalHub } from "./signalHub";
import { WebRTCClientAgora } from "./web-rtc-client-agora";
import type { member_state } from "./types";

export class WebRTCManager {
  public webRTCClient: WebRTCClientAgora;
  public agora_app_id: string;

  constructor(public member_id: string, public space_id: string) {
    this.webRTCClient = new WebRTCClientAgora(this.space_id, this.member_id);
    //     // default audio playback behavior
    this.webRTCClient.addRemoteStreamPublishedCallback(
      (member_id, mediaType, playable, mediaStreamTrack) => {
        playable.play();
      }
    );

    // first setup listeners/behaviors for joining leaving agora client
    this.setupListeners();
    // listeners only work if there is an app id
    signalHub.local
      .on("space_channel_connected")
      .pipe(take(1))
      .subscribe((resp) => {
        this.agora_app_id = resp.agora_app_id;
      });
  }

  setupListeners() {
    console.log("web rtc events setting up");

    signalHub.local
      .on("member_states_changed")
      .pipe(
        tap((event) => {
          console.log("member_states_changed", event);
        }),
        map((states: { [member_id: string]: member_state }) => {
          return Object.entries(states).reduce(
            (acc, [member_id, state]) => {
              acc.member_count += 1;
              if (!state.mic_muted) {
                acc.mic_on_count += 1;
              }
              return acc;
            },
            { mic_on_count: 0, member_count: 0 }
          );
        }),
        // filter by the final condition we care about
        map((obj) => obj.mic_on_count > 0 && obj.member_count > 1),
        // ignore dups
        distinctUntilChanged()
      )
      .subscribe(async (should_join) => {
        if (should_join) {
          console.log("publishing my audio");
          await this.webRTCClient.join(this.agora_app_id);
          await this.webRTCClient.publishAudio();
        } else {
          console.log("stopped my audio");
          await this.webRTCClient.unpublishAudio();
          await this.webRTCClient.leave();
        }
      });
  }
}
