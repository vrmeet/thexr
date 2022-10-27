import { filter } from "rxjs";
import type { Context } from "../../context";
import type { SignalHub } from "../../signalHub";
import type { ComponentObj } from "../components/component-obj";
import type { ISystem } from "./isystem";
import type { SystemAttendance } from "./system-attendance";
import type * as BABYLON from "babylonjs";

export class SystemCollectable implements ISystem {
  public name = "collectable";
  public order = 20;
  public context: Context;
  public signalHub: SignalHub;
  public systemAttendance: SystemAttendance;
  init(context: Context) {
    this.context = context;
    this.signalHub = this.context.signalHub;
    this.systemAttendance = this.context.systems[
      "attendance"
    ] as SystemAttendance;
    this.signalHub.local
      .on("mesh_picked")
      .pipe(
        filter(
          (mesh) => this.context.state[mesh.name]?.collectable !== undefined
        )
      )
      .subscribe((mesh) => {
        // add to state
        const comp = this.context.state[mesh.name].collectable;
        if (comp.value !== undefined) {
          this.handleCollectableValue(comp, mesh);
        }
      });
  }
  handleCollectableValue(
    comp: ComponentObj["collectable"],
    mesh: BABYLON.AbstractMesh
  ) {
    const label = comp.value.label;
    const amount = comp.value.amount;
    const oldValue =
      this.context.state[this.context.my_member_id].attendance
        .collectable_values[label] || 0;
    this.signalHub.outgoing.emit("components_upserted", {
      id: this.context.my_member_id,
      components: {
        attendance: {
          collectable_values: { [label]: oldValue + amount },
        },
      },
    });
    this.signalHub.outgoing.emit("entities_deleted", {
      ids: [mesh.name],
    });
  }
}
