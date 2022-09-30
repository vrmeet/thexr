import { Socket, Channel } from "phoenix";
import { pipe, scan, filter, map, throttleTime, mergeWith } from "rxjs";
import type { Context } from "../context";
import type { IncomingEvents, OutgoingEvents } from "../signalHub";
import type { PosRot } from "../types";
import type { IService } from "./service";

export class ServiceBroker implements IService {
  public name = "service-broker";
  public context: Context;
  public socket: Socket;
  public channel: Channel;
  init(context: Context) {
    this.context = context;
    this.socket = new Socket("/socket", {
      params: { token: this.context.userToken },
    });

    this.setupListeners();
  }

  setupListeners() {
    this.context.signalHub.incoming.on("server_lost").subscribe(() => {
      window.location.href = "/";
    });

    this.context.signalHub.local.on("client_ready").subscribe((choice) => {
      this.connectToChannel(choice);

      if (choice === "enter") {
        this.pipeCameraMovementToOutgoing();
        this.pipeOutgoingToChannel("entity_created");
        this.pipeOutgoingToChannel("entities_deleted");
        this.pipeOutgoingToChannel("components_upserted");
        this.pipeOutgoingToChannel("components_removed");
      }
    });
  }

  pipeOutgoingToChannel(pattern: keyof OutgoingEvents) {
    this.context.signalHub.outgoing.on(pattern).subscribe((data) => {
      if (this.channel) {
        this.channel.push(pattern, data);
      }
    });
  }

  connectToChannel(choice: "enter" | "observe") {
    this.channel = this.socket.channel(`space:${this.context.space_id}`, {
      choice: choice,
    });
    // forward incoming from channel to event bus
    this.channel.onMessage = (event: keyof IncomingEvents, payload) => {
      if (!event.startsWith("phx_") && !event.startsWith("chan_")) {
        console.log("channel incoming", event, payload);
        this.context.signalHub.incoming.emit(event, payload);
      }
      return payload;
    };

    this.socket.connect();
    this.channel
      .join()
      .receive("ok", (resp) => {
        console.log("joined channel", resp);
        this.context.signalHub.local.emit("space_channel_connected", resp);
        window["channel"] = this.channel;
      })
      .receive("error", (resp) => {
        console.error("Unable to join channel", resp);
      });
  }

  pipeCameraMovementToOutgoing() {
    const signalHub = this.context.signalHub;

    const payload = {
      left: null,
      right: null,
      head: null,
    };

    function throttleByMovement(movementDelta: number) {
      return pipe(
        scan(
          (acc, curPosRot: PosRot) => {
            const newSum =
              curPosRot.pos[0] +
              curPosRot.pos[1] +
              curPosRot.pos[2] +
              curPosRot.rot[0] +
              curPosRot.rot[1] +
              curPosRot.rot[2] +
              curPosRot.rot[3];
            const diff = Math.abs(acc.sum - newSum);
            return { diff: diff, sum: newSum, posRot: curPosRot };
          },
          { diff: 0, sum: 0, posRot: { pos: [0, 0, 0], rot: [0, 0, 0, 1] } }
        ),
        filter((data) => data.diff > movementDelta),
        map((data) => data.posRot)
      );
    }

    signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR))
      .subscribe(() => {
        payload.left = null;
        payload.right = null;
      });

    const leftMovement$ = signalHub.movement.on("left_hand_moved").pipe(
      throttleTime(50),
      map((orig) => ({
        pos: orig.pos,
        rot: orig.rot,
      })),
      throttleByMovement(0.005)
    );

    leftMovement$.subscribe((left) => {
      payload.left = left;
    });

    const rightMovement$ = signalHub.movement.on("right_hand_moved").pipe(
      throttleTime(50),
      map((orig) => ({
        pos: orig.pos,
        rot: orig.rot,
      })),
      throttleByMovement(0.005)
    );
    rightMovement$.subscribe((right) => {
      payload.right = right;
    });

    const camMovement$ = signalHub.movement.on("camera_moved").pipe(
      throttleTime(50),
      map((orig) => ({
        pos: orig.pos,
        rot: orig.rot,
      })),
      throttleByMovement(0.005)
    );

    camMovement$.subscribe((cam) => {
      payload.head = cam;
    });

    camMovement$
      .pipe(mergeWith(leftMovement$, rightMovement$), throttleTime(50))
      .subscribe(() => {
        if (!payload.head) {
          return;
        }

        signalHub.outgoing.emit("components_upserted", {
          id: this.context.my_member_id,
          components: { avatar: payload },
        });
      });
  }

  dispose() {}
}
