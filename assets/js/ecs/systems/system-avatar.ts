import type { Context } from "../../context";
import type { Entity } from "../entities/entity";
import type { ISystem } from "../system";
import type * as BABYLON from "babylonjs";
import { Avatar } from "./avatar/avatar";
import type { SignalHub } from "../../signalHub";
import { EventName } from "../../event-names";
import { filter } from "rxjs/operators";
import type { IEntityCreatedEvent, IMemberEnteredEvent } from "../../types";
import type { ComponentObj } from "../components/component-obj";

// position of an avatar should be at the feet

export class SystemAvatar implements ISystem {
  public name = "avatar";
  public avatars: Record<string, Avatar> = {};
  public scene: BABYLON.Scene;
  public context: Context;
  public signalHub: SignalHub;

  init(context: Context) {
    this.context = context;
    this.signalHub = context.signalHub;
    this.scene = context.scene;
    // this.signalHub.incoming.on("about_members").subscribe((members) => {
    //   for (const [member_id, payload] of Object.entries(members.movements)) {
    //     const avatar = this.createAvatar(member_id);
    //     avatar.pose(payload.pos_rot, null, null);
    //   }
    // });

    // this.signalHub.incoming.on("about_space").subscribe((about_space) => {
    //   // move grabbed entities into the hands of avatars
    //   for (const [entity_id, event] of Object.entries(about_space.entities)) {
    //     if (event.m === EventName.entity_grabbed) {
    //       this.findAvatar(event.p.member_id)?.grabEntity(
    //         event.p.hand,
    //         entity_id,
    //         event.p.entity_pos_rot,
    //         event.p.hand_pos_rot
    //       );
    //     } else if (event.m === EventName.entity_released) {
    //       this.findAvatar(event.p.member_id)?.releaseEntity(
    //         event.p.entity_id,
    //         event.p.entity_pos_rot,
    //         event.p.lv,
    //         event.p.av
    //       );
    //     } else if (event.m === EventName.entity_collected) {
    //       const avatar = this.findAvatar(event.p.member_id)?.collectEntity(
    //         event.p.entity_id
    //       );
    //     }
    //   }
    // });

    this.signalHub.incoming
      .on("event")
      .pipe(filter((mpts) => mpts.m === EventName.member_entered))
      .subscribe((mpts: IMemberEnteredEvent) => {
        const createEntityEvent: IEntityCreatedEvent = {
          m: EventName.entity_created2,
          p: {
            entity_id: mpts.p.member_id,
            components: <ComponentObj>{ avatar: mpts.p },
          },
        };
        this.signalHub.incoming.emit("event", createEntityEvent);
      });

    this.signalHub.incoming
      .on("event")
      .pipe(filter((mpts) => mpts.m === EventName.member_moved))
      .subscribe((mpts: IMemberMovedEvent) => {
        this.pose(mpts.p.pos_rot, mpts.p.left, mpts.p.right);
      });
    // this.signalHub.incoming.on("event").subscribe((mpts) => {
    //   if (mpts.m === EventName.member_entered) {
    //     const payload = mpts.p;
    //     const avatar = this.createAvatar(payload.member_id);
    //     avatar.pose(payload.pos_rot, null, null);
    //   } else if (mpts.m === EventName.member_moved) {
    //     const payload = mpts.p;
    //     const avatar = this.createAvatar(payload.member_id);
    //     avatar.pose(payload.pos_rot, payload.left, payload.right);
    //   } else if (mpts.m === EventName.member_left) {
    //     this.deleteAvatar(mpts.p.member_id);
    //   } else if (mpts.m === EventName.member_respawned) {
    //     const payload = mpts.p;
    //     const avatar = this.createAvatar(payload.member_id);
    //     avatar.pose(payload.pos_rot, null, null);
    //   } else if (mpts.m === EventName.entity_grabbed) {
    //     this.findAvatar(mpts.p.member_id).grabEntity(
    //       mpts.p.hand,
    //       mpts.p.entity_id,
    //       mpts.p.entity_pos_rot,
    //       mpts.p.hand_pos_rot
    //     );
    //   } else if (mpts.m === EventName.entity_released) {
    //     this.findAvatar(mpts.p.member_id).releaseEntity(
    //       mpts.p.entity_id,
    //       mpts.p.entity_pos_rot,
    //       mpts.p.lv,
    //       mpts.p.av
    //     );
    //   } else if (mpts.m === EventName.entity_collected) {
    //     this.findAvatar(mpts.p.member_id).collectEntity(mpts.p.entity_id);
    //   }
    // });
  }

  countAvatars() {
    return Object.keys(this.avatars).length;
  }

  findAvatar(member_id: string) {
    return this.avatars[member_id];
  }

  deleteAvatar(member_id: string) {
    if (!this.avatars[member_id]) {
      return;
    }
    this.avatars[member_id].dispose();
    delete this.avatars[member_id];
  }

  dispose() {}
  initEntity(entity: Entity) {
    if (entity.componentObj.avatar) {
      if (this.avatars[entity.name]) {
        return;
      }
      this.avatars[entity.name] = new Avatar(entity, this.context);
    }
  }
}
