/* eslint-disable no-prototype-builtins */
import type { Context } from "../../context";
import type { ISystem } from "./isystem";
import { filter } from "rxjs";
import type { ComponentObj } from "../components/component-obj";

export class SystemAttendees implements ISystem {
  public name = "service-attendees";
  public order = 3;
  public context: Context;
  public attendees: Record<string, ComponentObj> = {};

  init(context: Context) {
    this.context = context;

    this.context.signalHub.incoming
      .on("entity_created")
      .pipe(filter((evt) => evt.components.hasOwnProperty("nickname")))
      .subscribe((evt) => {
        this.attendees[evt.id] = evt.components;
      });

    this.context.signalHub.incoming.on("entities_deleted").subscribe((evt) => {
      evt.ids.forEach((id) => {
        delete this.attendees[id];
      });
    });
  }
}
