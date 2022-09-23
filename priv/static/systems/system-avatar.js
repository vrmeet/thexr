import { Avatar } from "./avatar/avatar";
import { EventName } from "../../event-names";
import { filter } from "rxjs/operators";
export class SystemAvatar {
  constructor() {
    this.name = "avatar";
    this.avatars = {};
  }
  init(context) {
    this.context = context;
    this.signalHub = context.signalHub;
    this.scene = context.scene;
    this.signalHub.incoming.on("event").pipe(filter((mpts) => mpts.m === EventName.member_entered)).subscribe((mpts) => {
      const createEntityEvent = {
        m: EventName.entity_created2,
        p: {
          entity_id: mpts.p.member_id,
          components: { avatar: mpts.p }
        }
      };
      this.signalHub.incoming.emit("event", createEntityEvent);
    });
    this.signalHub.incoming.on("event").pipe(filter((mpts) => mpts.m === EventName.member_moved)).subscribe((mpts) => {
      this.pose(mpts.p.pos_rot, mpts.p.left, mpts.p.right);
    });
  }
  countAvatars() {
    return Object.keys(this.avatars).length;
  }
  findAvatar(member_id) {
    return this.avatars[member_id];
  }
  deleteAvatar(member_id) {
    if (!this.avatars[member_id]) {
      return;
    }
    this.avatars[member_id].dispose();
    delete this.avatars[member_id];
  }
  dispose() {
  }
  initEntity(entity) {
    if (entity.componentObj.avatar) {
      if (this.avatars[entity.name]) {
        return;
      }
      this.avatars[entity.name] = new Avatar(entity, this.context);
    }
  }
}
