/*
Overlays a color over the camera
to indicate damage
*/

import * as BABYLON from "babylonjs";
import { BehaviorSubject } from "rxjs";
import { filter, take } from "rxjs/operators";
import { EventName } from "./event-names";
import { signalHub } from "./signalHub";

export class TintOverlay {
  public tintAmount: number;
  public tint: BehaviorSubject<"asc" | "desc" | "holding" | "none">;
  constructor(public member_id: string, public scene: BABYLON.Scene) {
    this.tintAmount = 0;
    this.tint = new BehaviorSubject("none");

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

    signalHub.incoming
      .on("event")
      .pipe(
        filter(
          (msg) =>
            msg.m === EventName.member_died &&
            msg.p.member_id === this.member_id
        )
      )
      .subscribe(() => {
        this.tint
          .pipe(
            filter((mode) => mode === "none"),
            take(1)
          )
          .subscribe((mode) => {
            this.tintUp(BABYLON.Color3.Green());
          });
      });

    signalHub.incoming
      .on("event")
      .pipe(
        filter(
          (msg) =>
            msg.m === EventName.member_respawned &&
            msg.p.member_id === this.member_id
        )
      )
      .subscribe(() => {
        this.tintDown();
      });

    signalHub.incoming
      .on("event")
      .pipe(
        filter(
          (msg) =>
            msg.m === EventName.member_damaged &&
            msg.p.member_id === this.member_id
        )
      )
      .subscribe(() => {
        // this.flashdamageOverlay2()
        this.tintUp(BABYLON.Color3.Red());
        this.tint
          .pipe(
            filter((mode) => mode === "holding"),
            take(1)
          )
          .subscribe((mode) => {
            this.tintDown();
          });
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
