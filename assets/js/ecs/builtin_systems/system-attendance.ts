import type { Context } from "../../context";
import type { ISystem } from "./isystem";
import type { ComponentObj } from "../components/component-obj";

export class SystemAttendance implements ISystem {
  public name = "attendance";
  public order = 3;
  public context: Context;
  public attendees: Record<string, ComponentObj> = {}; // entity to components

  init(context: Context) {
    this.context = context;
  }
  registerEntity(entity_id: string, components: ComponentObj): void {
    if (components.attendance !== undefined) {
      // for info about people in general, we just want a pointer to the state about this person
      // and synergizer has already updated the state
      this.attendees[entity_id] = this.context.state[entity_id];
    }
  }
}
