import { Socket, Channel } from "phoenix";
import { pipe, scan, filter, map, throttleTime, mergeWith } from "rxjs";
import type { Context } from "../context";
import type { ISystem } from "../ecs/system";
import type { IncomingEvents, OutgoingEvents } from "../signalHub";
import type { PosRot } from "../types";

export class ServiceBroker implements ISystem {
  public name = "system-broker";
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
    this.context.signalHub.local.on("client_ready").subscribe((choice) => {
      console.log("recevied client ready, about to connect to channel");
      this.connectToChannel(choice);

      if (choice === "enter") {
        this.pipeCameraMovementToOutgoing();
        this.pipeOutgoingToChannel("entity_created");
        this.pipeOutgoingToChannel("entity_deleted");
        this.pipeOutgoingToChannel("component_upserted");
        this.pipeOutgoingToChannel("component_removed");
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
    console.log("in connect to channel");
    this.channel = this.socket.channel(`space:${this.context.space_id}`, {
      choice: choice,
    });
    // forward incoming from channel to event bus
    this.channel.onMessage = (event: keyof IncomingEvents, payload) => {
      if (!event.startsWith("phx_") && !event.startsWith("chan_")) {
        //       console.log('channel incoming', event, payload)
        this.context.signalHub.incoming.emit(event, payload);
      }
      return payload;
    };
    this.socket.connect();
    console.log("calling join on channel");
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

        signalHub.outgoing.emit("component_upserted", {
          entity_id: this.context.my_member_id,
          name: "avatar",
          data: payload,
        });
      });
  }

  dispose() {}
}
