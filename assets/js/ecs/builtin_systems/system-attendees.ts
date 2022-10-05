/* eslint-disable no-prototype-builtins */
import type { Context } from "../../context";
import type { ISystem } from "./isystem";
import { filter } from "rxjs";
import type { ComponentObj } from "../components/component-obj";

export class SystemAttendees implements ISystem {
  public name = "system-attendees";
  public order = 3;
  public context: Context;
  public attendees: Record<string, ComponentObj> = {}; // entity to components

  init(context: Context) {
    this.context = context;
  }
  registerEntity(entity_id: string, components: ComponentObj): void {
    if (components.nickname !== undefined) {
      this.attendees[entity_id] = components;
    }
  }
  upsertComponents(entity_id: string, components: ComponentObj): void {
    if (
      components.nickname !== undefined &&
      this.attendees[entity_id] !== undefined
    ) {
      Object.assign(this.attendees[entity_id], components);
    }
  }
  deregisterEntity(entity_id: string): void {
    if (this.attendees[entity_id] !== undefined) {
      delete this.attendees[entity_id];
    }
  }
}
