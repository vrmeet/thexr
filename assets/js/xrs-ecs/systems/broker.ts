import type { ISystem } from "../system";
import type { XRS } from "../xrs";
import * as BABYLON from "babylonjs";
import type { Context } from "../context";
import { Channel, Socket } from "phoenix";
import type { IncomingEvents, OutgoingEvents } from "../../signalHub";
import { filter, map, mergeWith, pipe, scan, throttleTime } from "rxjs";
import type { PosRot } from "../../types";
import { camPosRot } from "../../utils/misc";

export class SystemBroker implements ISystem {
  public name = "broker";
  public context: Context;
  public socket: Socket;
  public channel: Channel;
  public xrs: XRS;
  setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
    this.socket = new Socket("/socket", {
      params: { token: this.context.user_token },
    });

    this.setupListeners();
  }
  setupListeners() {
    this.context.signalHub.incoming.on("space_state").subscribe((state) => {
      this.xrs.clearAllEntities();

      // draw any previously existing entities in genserver memory
      for (const [entity_id, components] of Object.entries(state)) {
        this.context.signalHub.incoming.emit("entity_created", {
          id: entity_id,
          components: components,
        });
      }
      // send initial entity for self if not already in the state
      if (!state[this.context.my_member_id]) {
        this.enter();
      } else {
        // check if there are differences and send those
        if (
          state[this.context.my_member_id].nickname !== this.context.my_nickname
        ) {
          this.context.signalHub.outgoing.emit("components_upserted", {
            id: this.context.my_member_id,
            components: {
              attendance: {
                nickname: this.context.my_nickname,
                mic_muted: this.context.my_mic_muted,
              },
            },
          });
        }
      }
    });

    this.context.signalHub.incoming.on("entity_created").subscribe((evt) => {
      // components can be marked nil if just deleted and just loaded state from a genserver
      if (evt.components !== null) {
        this.xrs.createEntity(evt.id, evt.components);
        // this.registerEntity(evt.id, evt.components);
      }
    });

    this.context.signalHub.incoming.on("entities_deleted").subscribe((evt) => {
      evt.ids.forEach((id) => {
        this.xrs.deleteEntity(id);
        // this.deregisterEntity(id);
      });
    });

    this.context.signalHub.incoming
      .on("components_upserted")
      .subscribe((evt) => {
        const entity = this.xrs.getEntity(evt.id);
        if (!entity) {
          console.warn("cannot upsert components of undefined entity", evt);
          return;
        }
        Object.entries(evt.components).forEach(([componentName, data]) => {
          if (entity.hasComponent(componentName)) {
            entity.updateComponent(componentName, data);
          } else {
            entity.addComponent(componentName, data);
          }
        });
      });

    this.context.signalHub.incoming.on("msg").subscribe((data) => {
      const system = this.xrs.getSystem(data.system);
      if (system && system.processMsg !== undefined) {
        system.processMsg(data.data);
      }
    });

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
        this.pipeOutgoingToChannel("msg");
      }
    });
  }

  pipeOutgoingToChannel(pattern: keyof OutgoingEvents) {
    this.context.signalHub.outgoing.on(pattern).subscribe((data) => {
      // send to self for fast reaction
      this.context.signalHub.incoming.emit(pattern, data as any);
      if (this.channel) {
        this.channel.push(pattern, data);
      }
    });
  }

  connectToChannel(choice: "enter" | "observe") {
    this.channel = this.socket.channel(`space:${this.context.space.id}`, {
      choice: choice,
    });
    this.context.channel = this.channel;
    // forward incoming from channel to event bus
    this.channel.onMessage = (event: keyof IncomingEvents, payload) => {
      if (!event.startsWith("phx_") && !event.startsWith("chan_")) {
        this.context.signalHub.incoming.emit(event, payload);
      }
      return payload;
    };

    this.socket.connect();
    this.channel
      .join()
      .receive("ok", (resp) => {
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

  enter() {
    this.context.signalHub.outgoing.emit("entity_created", {
      id: this.context.my_member_id,
      components: {
        avatar: { head: camPosRot(this.context.scene.activeCamera) },
        attendance: {
          nickname: this.context.my_nickname,
          mic_muted: this.context.my_mic_muted,
          collectable_values: { health: 100 },
          collectable_items: [],
        },
      },
    });
    this.context.signalHub.outgoing.emit("msg", {
      system: "hud",
      data: { msg: `${this.context.my_nickname} entered` },
    });
  }
}
