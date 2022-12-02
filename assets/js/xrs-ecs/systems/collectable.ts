import { filter, Subscription, take } from "rxjs";
import type * as BABYLON from "babylonjs";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";
import type { Context } from "../context";
import type { SignalHub } from "../../signalHub";
import type { AttendanceData, SystemAttendance } from "./attendance";
import type { XRS } from "../xrs";
import type { Entity } from "../entity";

export class SystemCollectable
  extends BaseSystemWithBehaviors
  implements ISystem
{
  public name = "collectable";
  public order = 20;
  public context: Context;
  public signalHub: SignalHub;
  public systemAttendance: SystemAttendance;
  public xrs: XRS;
  setup(xrs: XRS) {
    this.context = xrs.context;
    this.signalHub = this.context.signalHub;
    this.systemAttendance = this.context.systems[
      "attendance"
    ] as SystemAttendance;
  }
  buildBehavior(): IBehavior {
    return new BehaviorCollectable(this);
  }
}

type CollectableType = {
  value?: { label: string; amount: number };
  item?: string;
};

export class BehaviorCollectable implements IBehavior {
  data: CollectableType;
  entity: Entity;
  mesh: BABYLON.AbstractMesh;
  subscription: Subscription;
  public signalHub: SignalHub;
  constructor(public system: SystemCollectable) {
    this.signalHub = system.context.signalHub;
  }
  add(entity: Entity, data: CollectableType): void {
    this.entity = entity;
    this.data = data;
    this.mesh = this.entity.transformable as BABYLON.AbstractMesh;
    this.subscription = this.makeSubscription();
  }
  update(data: CollectableType): void {
    Object.assign(this.data, data);
  }
  remove(): void {
    this.subscription.unsubscribe();
  }
  makeSubscription() {
    return this.system.signalHub.local
      .on("mesh_picked")
      .pipe(
        filter((mesh) => mesh.name === this.entity.name),
        take(1)
      )
      .subscribe(() => {
        this.emitTransfer();
      });
  }
  emitTransfer() {
    if (this.data.item) {
      this.emitTransferItem();
    } else if (this.data.value) {
      this.emitTransferValue();
    }

    this.signalHub.outgoing.emit("entities_deleted", {
      ids: [this.entity.name],
    });
  }
  emitTransferItem() {
    // TODO
  }
  emitTransferValue() {
    const existingAttendance = this.system.systemAttendance.getBehaviorData(
      this.entity
    ) as AttendanceData;
    const oldValue =
      existingAttendance.collectable_values[this.data.value.label];

    this.signalHub.outgoing.emit("components_upserted", {
      id: this.system.context.my_member_id,
      components: {
        attendance: {
          collectable_values: {
            [this.data.value.label]: oldValue + this.data.value.amount,
          },
        },
      },
    });
  }
}
