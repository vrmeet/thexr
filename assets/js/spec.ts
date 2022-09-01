/// <reference types="svelte" />

import { Synergize } from "./synergizer";
import * as BABYLON from "babylonjs";
import { SystemLighting } from "./ecs/systems/system-lighting";
import { SystemInline } from "./ecs/systems/system-inline";
import { SystemAvatar } from "./ecs/systems/system-avatar";
import type { IEntityCreatedEvent } from "./types";
import type { ComponentObj } from "./ecs/components/component-obj";
import { EventName } from "./event-names";

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
  window["synergizer"] = new Synergize(member_id, engine, []);
  const synergizer = window["synergizer"];
  window["SystemLighting"] = SystemLighting;
  window["SystemInline"] = SystemInline;
  window["SystemAvatar"] = SystemAvatar;
  window["synergizer"].addSystem(new SystemLighting());
  window["synergizer"].addSystem(new SystemInline());
  window["synergizer"].addSystem(new SystemAvatar());
  const avatarCreated: IEntityCreatedEvent = {
    m: EventName.entity_created2,
    p: {
      entity_id: "avatar1",
      components: <ComponentObj>{
        avatar: true,
      },
    },
  };
  const lightCreated: IEntityCreatedEvent = {
    m: EventName.entity_created2,
    p: {
      entity_id: "light1",
      components: <ComponentObj>{
        lighting: true,
      },
    },
  };
  synergizer.context.signalHub.incoming.emit("event", lightCreated);
  synergizer.context.signalHub.incoming.emit("event", avatarCreated);
});
