/* ability to show a message that is sticky to VR camera */
import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import type { Context } from "../context";
import type { ISystem } from "../system";
import type { XRS } from "../xrs";
import type { SignalHub } from "../../signalHub";
import { filter, map, scan } from "rxjs";

const MSG_DURATION = 3000; // ms

export class SystemHUD implements ISystem {
  public xrs: XRS;
  public context: Context;
  public name = "hud";
  public order = 30;

  plane: BABYLON.Mesh;
  texture: GUI.AdvancedDynamicTexture;
  guiText: GUI.TextBlock;
  animation: BABYLON.Animatable;
  timeout: any;
  signalHub: SignalHub;
  scene: BABYLON.Scene;
  setup(xrs: XRS): void {
    this.xrs = xrs;

    this.context = xrs.context;
    this.signalHub = xrs.context.signalHub;
    this.scene = xrs.context.scene;
    const utilLayer = BABYLON.UtilityLayerRenderer.DefaultUtilityLayer;
    this.plane = BABYLON.MeshBuilder.CreatePlane(
      "hud_msg_plane",
      { size: 5 },
      utilLayer.utilityLayerScene
    );
    this.plane.position.z = 2.5;
    this.plane.isPickable = false;
    this.plane.visibility = 0;
    this.plane.setEnabled(false);

    this.texture = GUI.AdvancedDynamicTexture.CreateForMesh(
      this.plane,
      2024,
      2024,
      false
    );
    this.texture.hasAlpha = true;
    this.guiText = new GUI.TextBlock("hud_text", "");
    this.texture.addControl(this.guiText);

    // single messages come in, let's accumulate them if they come in too frequently
    this.signalHub.incoming
      .on("msg")
      .pipe(
        filter((value) => value.system === this.name),
        map((value) => value.data.msg as string),
        scan((acc, payload) => {
          const modifiedPayload = { ts: Date.now(), p: payload };
          acc.push(modifiedPayload);
          acc = acc.filter((data) => data.ts > Date.now() - MSG_DURATION);
          return acc.slice(-20);
        }, []),
        map((data) => {
          return data.map((value) => value.p);
        })
      )
      .subscribe((msgs) => {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }
        this.showHudMessages(msgs);
        this.timeout = setTimeout(() => {
          if (this.plane.visibility > 0) {
            this.animation = BABYLON.Animation.CreateAndStartAnimation(
              "",
              this.plane,
              "visibility",
              60,
              10 * 30,
              this.plane.visibility,
              0,
              BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
          }
        }, MSG_DURATION);
      });
  }

  showHudMessages(msgs: string[]) {
    if (this.animation) {
      this.animation.stop();
      this.animation = null;
    }
    this.plane.parent = this.scene.activeCamera;
    // create GUI
    this.guiText.text = msgs.join("\n");
    this.guiText.color = "#FFFFFF";
    const arrayOfTextLengths = msgs.map((text) => text.length);
    this.guiText.fontSize = this.calculateFontSize(
      Math.max(...arrayOfTextLengths)
    );

    this.plane.setEnabled(true);

    if (this.plane.visibility < 1) {
      this.animation = BABYLON.Animation.CreateAndStartAnimation(
        "",
        this.plane,
        "visibility",
        60,
        30,
        this.plane.visibility,
        1,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
    }
  }

  calculateFontSize(textLength: number) {
    return 700 / textLength + 15;
  }
}
