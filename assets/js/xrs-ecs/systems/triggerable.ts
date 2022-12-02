import { filter, takeUntil } from "rxjs";
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
  order = 50;
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
  constructor(public system: SystemTriggerable) {
    this.signalHub = system.xrs.context.signalHub;
  }
  add(entity: Entity, data: TriggerableType): void {
    this.entity = entity;
    this.data = data;
  }
  update(data: TriggerableType): void {
    this.data = data;
  }
  remove(): void {}
  buildSubscription(hand: "left" | "right") {
    // while this mesh is held
    this.signalHub.movement.on(`${hand}_grip_mesh`).subscribe((gripEvent) => {
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
        .subscribe((triggerEvent) => {
          console.log("trigger pulled while holding mesh");
          this.signalHub.movement.emit("trigger_holding_mesh", {
            hand,
            mesh: gripEvent.mesh,
            input: triggerEvent,
          });
        });
    });
  }
}
