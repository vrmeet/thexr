/* eslint-disable no-prototype-builtins */
import type { Context } from "../context";
import type { IService } from "./service";
import { filter } from "rxjs";
import type { ComponentObj } from "../ecs/components/component-obj";

export class ServiceAttendees implements IService {
  public name = "service-attendees";
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
