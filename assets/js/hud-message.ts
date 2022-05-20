/* ability to show a message that is sticky to VR camera */
import * as BABYLON from "babylonjs"
import * as GUI from "babylonjs-gui"

import { merge, interval } from 'rxjs'
import { scan, map, debounceTime, mapTo, tap } from 'rxjs/operators'
import { signalHub } from "./signalHub"

const MSG_DURATION = 3000 // ms

export class HudMessager {

    label: BABYLON.Mesh
    texture: GUI.AdvancedDynamicTexture
    guiText: GUI.TextBlock
    animation: BABYLON.Animatable

    constructor(public scene: BABYLON.Scene) {
        const utilLayer = BABYLON.UtilityLayerRenderer.DefaultUtilityLayer
        this.label = BABYLON.MeshBuilder.CreatePlane("hud_msg_plane", { size: 5 }, utilLayer.utilityLayerScene);
        // this.label.parent =
        this.label.position.z = 2.5
        this.label.isPickable = false
        this.label.visibility = 0
        this.label.setEnabled(false)

        this.texture = GUI.AdvancedDynamicTexture.CreateForMesh(
            this.label,
            2024,
            2024,
            false
        )
        this.texture.hasAlpha = true
        this.guiText = new GUI.TextBlock("hud_text", "")
        this.texture.addControl(this.guiText);

        // single messages come in, let's accumulate them if they come in too frequently
        signalHub.local.on("hud_msg").pipe(
            scan((acc, payload) => {
                let modifiedPayload = { ts: Date.now(), p: payload }
                acc.push(modifiedPayload)
                acc = acc.filter((data) => (data.ts > Date.now() - MSG_DURATION))
                return acc.slice(-20)
            }, []),
            map(
                data => {
                    return data.map(value => (value.p))
                }
            )
        ).subscribe(msgs => {
            this.showHudMessages(msgs)
        })

        // as messages come in, wait 3 seconds then hide the messages, but if more messages come in keep them up
        signalHub.local.on("hud_msg").pipe(
            debounceTime(MSG_DURATION)
        ).subscribe(() => {
            if (this.label.visibility > 0) {
                this.animation = BABYLON.Animation.CreateAndStartAnimation("", this.label, "visibility", 60, 10 * 30, this.label.visibility, 0, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT)
            }
        })


    }

    showHudMessages(msgs: string[]) {
        if (this.animation) {
            this.animation.stop()
            this.animation = null;
        }
        this.label.parent = this.scene.activeCamera
        // create GUI
        this.guiText.text = msgs.join("\n")
        this.guiText.color = "#FFFFFF"
        let arrayOfTextLengths = msgs.map((text) => (text.length))
        this.guiText.fontSize = this.calculateFontSize(Math.max(...arrayOfTextLengths))

        this.label.setEnabled(true)

        if (this.label.visibility < 1) {
            this.animation = BABYLON.Animation.CreateAndStartAnimation("", this.label, "visibility", 60, 30, this.label.visibility, 1, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT)
        }
    }


    calculateFontSize(textLength: number) {
        return (700 / textLength) + 15
    }

}

