/// <reference types="svelte" />

import { Synergize } from "./synergizer";
import * as BABYLON from "babylonjs";
import { SystemLighting } from "./ecs/systems/system-lighting";
import { SystemInline } from "./ecs/systems/system-inline";
import { SystemAvatar } from "./ecs/systems/system-avatar";
import type { IEntityCreatedEvent } from "./types";
import type { ComponentObj } from "./ecs/components/component-obj";
import { EventName } from "./event-names";
import { SystemShape } from "./ecs/systems/system-shape";
import { SystemLift } from "./ecs/systems/system-lift";
import { SystemTransform } from "./ecs/systems/system-transform";

window.addEventListener("DOMContentLoaded", async () => {
  const member_id = window["member_id"];
  if (!member_id) {
    return;
  }
  const canvas = document.getElementById("dummy") as HTMLCanvasElement;
  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });
  const synergizer = new Synergize(member_id, engine, [
    new SystemAvatar(),
    new SystemInline(),
    new SystemLift(),
    new SystemLighting(),
    new SystemShape(),
    new SystemTransform(),
  ]);

  // const avatarCreated: IEntityCreatedEvent = {
  //   m: EventName.entity_created2,
  //   p: {
  //     entity_id: "avatar1",
  //     components: <ComponentObj>{
  //       avatar: true,
  //     },
  //   },
  // };
  // const lightCreated: IEntityCreatedEvent = {
  //   m: EventName.entity_created2,
  //   p: {
  //     entity_id: "light1",
  //     components: <ComponentObj>{
  //       lighting: true,
  //     },
  //   },
  // };
  // synergizer.context.signalHub.incoming.emit("event", lightCreated);
  // synergizer.context.signalHub.incoming.emit("event", avatarCreated);
  window["synergizer"] = synergizer;
});
