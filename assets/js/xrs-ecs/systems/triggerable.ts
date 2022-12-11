import { filter, Subscription, takeUntil } from "rxjs";
import type { SignalHub } from "../../signalHub";
import type { Entity } from "../entity";
import {
  BaseSystemWithBehaviors,
  type IBehavior,
  type ISystem,
} from "../system";

export class SystemTriggerable
  extends BaseSystemWithBehaviors
  implements ISystem
{
  name = "triggerable";
  order = 30;
  buildBehavior() {
    return new BehaviorTriggerable(this);
  }
}

type TriggerableType = {
  type: "discreet" | "continuous";
};

export class BehaviorTriggerable implements IBehavior {
  data: TriggerableType;
  entity: Entity;
  signalHub: SignalHub;
  subscriptions: Subscription[] = [];
  constructor(public system: SystemTriggerable) {
    this.signalHub = system.xrs.context.signalHub;
  }
  add(entity: Entity, data: TriggerableType): void {
    this.entity = entity;
    this.data = data;
    this.buildSubscription("left");
    this.buildSubscription("right");
  }
  update(data: TriggerableType): void {
    this.data = data;
  }
  remove(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  buildSubscription(hand: "left" | "right") {
    // while this mesh is held
    const sub = this.signalHub.movement
      .on(`${hand}_grip_mesh`)
      .pipe(filter((evt) => evt.mesh.name === this.entity.name))
      .subscribe((gripEvent) => {
        // listen to trigger
        this.signalHub.movement
          .on(`${hand}_trigger_squeezed`)
          .pipe(
            takeUntil(
              this.signalHub.movement
                .on(`${hand}_lost_mesh`)
                .pipe(filter((evt) => evt.mesh.name === this.entity.name))
            )
          )
          .subscribe(() => {
            this.signalHub.movement.emit("trigger_holding_mesh", {
              hand,
              mesh: gripEvent.mesh,
            });
          });
      });
    this.subscriptions.push(sub);
  }
}
