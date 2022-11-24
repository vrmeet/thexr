import * as BABYLON from "babylonjs";
import { filter, take, type BehaviorSubject } from "rxjs";
import type { SignalHub } from "../../signalHub";
import type { Context } from "../context";
import type { ISystem } from "../system";
import type { XRS } from "../xrs";

export class SystemTintOverlay implements ISystem {
  public name = "tint-overlay";
  public order = 30;
  public context: Context;
  public tintAmount: number;
  public signalHub: SignalHub;
  public tint: BehaviorSubject<"asc" | "desc" | "holding" | "none">;
  public scene: BABYLON.Scene;
  public xrs: XRS;
  setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
    this.signalHub = xrs.context.signalHub;
    this.scene = xrs.context.scene;
    BABYLON.Effect.ShadersStore["tintFragmentShader"] = `
        #ifdef GL_ES
            precision highp float;
        #endif
    
        // Samplers
        varying vec2 vUV;
        uniform sampler2D textureSampler;
    
        // Parameters
        uniform vec4 tintColor;    
        uniform float tintAmount;
    
        void main(void) 
        {        
            vec4 baseColor = texture2D(textureSampler, vUV);
            gl_FragColor = mix(baseColor, tintColor, tintAmount);
        }
        `;
  }

  flash(color: BABYLON.Color3) {
    this.tintUp(color);
    this.tint
      .pipe(
        filter((mode) => mode === "holding"),
        take(1)
      )
      .subscribe(() => {
        this.tintDown();
      });
  }

  tintUp(color: BABYLON.Color3, speed = 0.03) {
    if (this.tint.value !== "none") {
      return false;
    }

    const tintPostProcess = new BABYLON.PostProcess(
      "tintPostProcess",
      "tint",
      ["tintColor", "tintAmount"],
      null,
      1,
      this.scene.activeCamera
    );
    this.tintAmount = 0;
    tintPostProcess.onApply = (effect) => {
      effect.setColor4("tintColor", color, 1);
      effect.setFloat("tintAmount", this.tintAmount);
    };
    tintPostProcess.samples = 4;
    this.tint.next("asc");

    const ascend = () => {
      if (this.tint.value === "asc") {
        this.tintAmount += this.scene.getAnimationRatio() * 0.03;
        this.tintAmount = Math.min(0.5, this.tintAmount);
        if (this.tintAmount == 0.5) {
          this.tint.next("holding");
        }
      } else if (this.tint.value === "desc") {
        this.tintAmount -= this.scene.getAnimationRatio() * 0.03;
        if (this.tintAmount < 0) {
          this.tintAmount = 0;
          this.tint.next("none");
          this.scene.unregisterBeforeRender(ascend);
          tintPostProcess.dispose();
        }
      }
    };
    this.scene.registerBeforeRender(ascend);
    return true;
  }

  tintDown(speed = 0.03) {
    if (this.tint.value !== "holding") {
      return false;
    }
    this.tint.next("desc");
    return true;
  }
}
