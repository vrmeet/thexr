import type { Context } from "../context";
import type { IService } from "./service";
import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import type { SignalHub } from "../signalHub";
import { filter } from "rxjs";
import { isMobileVR } from "../utils/utils-browser";

export class ServiceMenu implements IService {
  name: "service-menu";
  public fsGui: GUI.AdvancedDynamicTexture;
  public context: Context;
  public signalHub: SignalHub;
  init(context: Context) {
    this.context = context;
    this.signalHub = context.signalHub;
    this.signalHub.local
      .on("client_ready")
      .pipe(filter((choice) => choice === "enter"))
      .subscribe(() => {
        // check if mobile
        if (isMobileVR()) {
          this.loadVRMenu();
        } else {
          this.loadFullScreenMenu();
        }
      });

    this.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR))
      .subscribe(() => {
        this.loadFullScreenMenu();
      });

    this.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.ENTERING_XR))
      .subscribe(() => {
        this.loadVRMenu();
      });

    /*
   
*/
  }

  loadFullScreenMenu() {}
  loadVRMenu() {}
}
