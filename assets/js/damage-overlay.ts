/*
Overlays a color over the camera
to indicate damage
*/

import * as BABYLON from "babylonjs"
import { filter } from "rxjs/operators"
import { EventName } from "./event-names"
import type { Orchestrator } from "./orchestrator"
import { signalHub } from "./signalHub"


export class DamageOverlay {
    public scene: BABYLON.Scene

    constructor(public orchestrator: Orchestrator) {
        this.scene = orchestrator.sceneManager.scene;
        // BABYLON.Effect.ShadersStore['damageOverlayEffectFragmentShader'] = `
        //     varying vec2 vUV;
        //     uniform sampler2D textureSampler;
        //     uniform float time;

        //     void main(void){
        //       vec3 c = texture2D(textureSampler, vUV).rgb;
        //       c.r += time;
        //       c.gb -= time;
        //       gl_FragColor = vec4(c, 1.0);
        //     }
        //     `

        signalHub.incoming.on("event").pipe(
            filter(msg => (msg.m === EventName.member_damaged && msg.p.member_id === this.orchestrator.member_id))
        ).subscribe(rate => {
            this.flashdamageOverlay2()
        })
    }

    flashdamageOverlay2() {
        this.scene.fogColor = BABYLON.Color3.Red()
        const a = new BABYLON.Animation("damage", "fogDensity", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames = [];
        const rate = 30
        keyFrames.push({
            frame: 0,
            value: 0,
        });

        keyFrames.push({
            frame: rate,
            value: 1,
        });

        keyFrames.push({
            frame: 2 * rate,
            value: 0,
        });

        a.setKeys(keyFrames);
        this.scene.animations.push(a)
        this.scene.beginAnimation(this.scene, 0, 2 * rate, true);
        // this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        // this.scene.fogColor = BABYLON.Color3.FromHexString(settings.fog_color)
        // this.scene.fogDensity = settings.fog_density
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
