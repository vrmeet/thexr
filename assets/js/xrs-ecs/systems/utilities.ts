import type { Context } from "../context";
import type { ISystem } from "../system";
import type { XRS } from "../xrs";
import * as BABYLON from "babylonjs";

const ANIMATION_FRAME_PER_SECOND = 60;

export class SystemUtilities implements ISystem {
  name = "utilities";
  public xrs: XRS;
  public animatables: Record<string, BABYLON.Animatable> = {};
  public context: Context;
  setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
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
      const animationName = `translate_${target.name}`;
      if (this.animatables[animationName]) {
        this.animatables[animationName].stop();
        delete this.animatables[animationName];
      }
      const animatable = BABYLON.Animation.CreateAndStartAnimation(
        animationName,
        target,
        "position",
        ANIMATION_FRAME_PER_SECOND,
        Math.ceil((req.duration * 60) / 1000),
        from,
        to,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        null,
        () => {
          if (req.callback) {
            req.callback();
            delete this.animatables[animationName];
          }
        },
        this.context.scene
      );
      this.animatables[animationName] = animatable;
    });

    //rotation
    this.context.signalHub.service.on("animate_rotation").subscribe((req) => {
      let target = req.target;
      if (typeof target === "string") {
        target = this.context.scene.getMeshByName(target);
      }
      let from = req.from;
      let to = req.to;
      if (Array.isArray(from)) {
        from = BABYLON.Quaternion.FromArray(from);
      }
      if (Array.isArray(to)) {
        to = BABYLON.Quaternion.FromArray(to);
      }
      const animationName = `rotation_${target.name}`;
      if (this.animatables[animationName]) {
        this.animatables[animationName].stop();
        delete this.animatables[animationName];
      }
      const animatable = BABYLON.Animation.CreateAndStartAnimation(
        animationName,
        target,
        "rotationQuaternion",
        ANIMATION_FRAME_PER_SECOND,
        Math.ceil((req.duration * 60) / 1000),
        from,
        to,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        null,
        () => {
          if (req.callback) {
            req.callback();
            delete this.animatables[animationName];
          }
        },
        this.context.scene
      );
      this.animatables[animationName] = animatable;
    });
  }
}
