/// <reference types="svelte" />

import { XRS } from "./xrs-ecs/xrs";
// import * as BABYLON from "babylonjs";

window["XRS"] = new XRS();

// const member_id = window["member_id"];
// const space = window["space"];
// const webrtc_channel_id = window["webrtc_channel_id"];
// const userToken = window["userToken"];

// if (!member_id) {
//   return;
// }
// const canvas = document.getElementById(space.id) as HTMLCanvasElement;
// const engine = new BABYLON.Engine(canvas, true, {
//   preserveDrawingBuffer: true,
//   stencil: true,
// });

// const synergizer = new Synergize(
//   member_id,
//   space,
//   webrtc_channel_id,
//   userToken,
//   engine
// );
// window["synergizer"] = synergizer;
// // synergizer.context.bypass_modal = true;
// await synergizer.init();
// if (typeof window["systems"] === "string" && window["systems"].length > 0) {
//   const systemPaths = window["systems"].split(",");
//   for (let i = 0; i < systemPaths.length; i++) {
//     const path = systemPaths[i];
//     await synergizer.addRemoteSystem(path);
//   }
//   // (async (sys) => {
//   //   await synergizer.addSystem(sys);
//   // });
// }

// synergizer.run();
