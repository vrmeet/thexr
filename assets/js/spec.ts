/// <reference types="svelte" />

import { Synergize } from "./synergizer";
import * as BABYLON from "babylonjs";
import { SystemLighting } from "./ecs/systems/system-lighting";
import { SystemInline } from "./ecs/systems/system-inline";
import { SystemAvatar } from "./ecs/systems/system-avatar";
import { SystemShape } from "./ecs/systems/system-shape";
import { SystemLift } from "./ecs/systems/system-lift";
import { SystemTransform } from "./ecs/systems/system-transform";
import { SystemMaterial } from "./ecs/systems/system-material";

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
    // new SystemAvatar(),
    // new SystemInline(),
    // new SystemLift(),
    // new SystemLighting(),
    new SystemShape(),
    new SystemTransform(),
    // new SystemMaterial(),
  ]);
  window["synergizer"] = synergizer;
});
