/// <reference types="svelte" />

import { Synergize } from "./synergizer";
import * as BABYLON from "babylonjs";

window.addEventListener("DOMContentLoaded", async () => {
  const member_id = window["member_id"];
  const space_id = window["space_id"];
  const webrtc_channel_id = window["webrtc_channel_id"];
  const userToken = window["userToken"];

  if (!member_id) {
    return;
  }
  const canvas = document.getElementById(space_id) as HTMLCanvasElement;
  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });

  const synergizer = new Synergize(
    member_id,
    space_id,
    webrtc_channel_id,
    userToken,
    engine
  );
  window["synergizer"] = synergizer;
  console.log("systems is", window["systems"]);
  if (typeof window["systems"] === "string" && window["systems"].length > 0) {
    const systemPaths = window["systems"].split(",");
    for (let i = 0; i < systemPaths.length; i++) {
      const path = systemPaths[i];
      await synergizer.addSystem(path);
    }
    // (async (sys) => {
    //   console.log("attempting to add system", sys);
    //   await synergizer.addSystem(sys);
    // });
  }
  console.log("sending client ready");
  synergizer.context.signalHub.local.emit("client_ready", "enter");
});
