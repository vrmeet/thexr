import type { Context } from "../context";
import * as BABYLON from "babylonjs";

const ANIMATION_FRAME_PER_SECOND = 60;

export class ServiceUtilities {
  name: "service-utilities";
  public context: Context;
  init(context: Context) {
    this.context = context;
    this.context.signalHub.service.on("animate_translate").subscribe((req) => {
      let target = req.target;
      if (typeof target === "string") {
        target = this.context.scene.getMeshByName(target);
      }
      let from = req.from;
      let to = req.to;
      if (Array.isArray(from)) {
        from = BABYLON.Vector3.FromArray(from);
      }
      if (Array.isArray(to)) {
        to = BABYLON.Vector3.FromArray(to);
      }
      console.log("req", req);
      console.log("received animation request", target, from, to);
      const animatable = BABYLON.Animation.CreateAndStartAnimation(
        `translate_${target.name}`,
        target,
        "position",
        ANIMATION_FRAME_PER_SECOND,
        Math.ceil((req.duration * 60) / 1000),
        from,
        to,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        null,
        () => {
          console.log("applying callback");
          req.callback();
        },
        this.context.scene
      );
      console.log("animateable", animatable);
    });
  }
}
