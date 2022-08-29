/// <reference types="svelte" />

import { Synergize } from "./synergizer";
import * as BABYLON from "babylonjs";

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
});
