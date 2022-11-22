import type { Context } from "../context";
import type { XRS } from "../xrs";
import * as sessionPersistance from "../../sessionPersistance";
import type { Entity } from "../entity";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";

/**
 * simply keep track of the entities that represent people
 */
export type AttendanceData = {
  mic_muted?: boolean;
  nickname?: string;
  collectable_values?: Record<string, number>;
  collectable_items?: string[];
};

export class SystemAttendance
  extends BaseSystemWithBehaviors
  implements ISystem
{
  public xrs: XRS;
  name = "attendance";
  order = 10;
  public context: Context;
  setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
    this.context.my_nickname =
      sessionPersistance.getNickname()?.nickname || this.context.my_member_id;
  }
  buildBehavior(): IBehavior {
    return new BehaviorAttendance(this);
  }
}

export class BehaviorAttendance implements IBehavior {
  public data: AttendanceData;
  constructor(public system: SystemAttendance) {}
  public entity: Entity;
  add(target: Entity, data: AttendanceData) {
    this.entity = target;
    this.data = data;
  }
  update(data: AttendanceData) {
    Object.assign(this.data, data);
  }
  remove() {
    this.data = {};
  }
}
