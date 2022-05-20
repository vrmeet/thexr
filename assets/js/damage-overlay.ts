/*
Overlays a color over the camera
to indicate damage
*/

import * as BABYLON from "babylonjs"
import { filter } from "rxjs/operators"
import type { Orchestrator } from "./orchestrator"
import { signalHub } from "./signalHub"


export class DamageOverlay {
    public scene: BABYLON.Scene

    constructor(public orchestrator: Orchestrator) {
        this.scene = orchestrator.sceneManager.scene;
        BABYLON.Effect.ShadersStore['damageOverlayEffectFragmentShader'] = `
            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform float time;
      
            void main(void){
              vec3 c = texture2D(textureSampler, vUV).rgb;
              c.r += time;
              c.gb -= time;
              gl_FragColor = vec4(c, 1.0);
            }
            `

        signalHub.incoming.on("event").pipe(
            filter(msg => (msg.m === "member_damaged" && msg.p.member_id === this.orchestrator.member_id))
        ).subscribe(rate => {
            this.flashdamageOverlay()
        })
    }



    flashdamageOverlay(rate = 0.03) {

        let time = 0
        let postEffect = new BABYLON.PostProcess(
            "damageOverlayEffect",
            "damageOverlayEffect",
            ["time"],
            null,
            1,
            this.scene.activeCamera)

        postEffect.onApply = (effect) => {
            effect.setFloat('time', time)
        }
        let ascending = true
        let ascend = () => {
            if (ascending) {
                time += this.scene.getAnimationRatio() * rate
                time = Math.min(0.5, time)
                if (time == 0.5) {
                    ascending = false
                }
            } else {
                time -= this.scene.getAnimationRatio() * rate
                if (time < 0) {
                    time = 0
                    this.scene.unregisterBeforeRender(ascend)
                    // try this? postEffect.dispose()
                }
            }
        }
        this.scene.registerBeforeRender(ascend)
    }
}
