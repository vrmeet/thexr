import { filter, Subscription } from "rxjs";
import type { Context } from "../../context";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";
import { makeXRFrameSignal } from "../../utils/misc";
import type { SystemXR } from "./system-xr";

const NORMAL_DAMPENING_FACTOR = 0.1;
const GO_FASTER_DAMPENING = 0.2;

export class SystemXRFlight implements ISystem {
  public context: Context;
  public name = "xr-flight";
  public order = 20;
  public forwardVelocity = 0;
  public sideVelocity = 0;
  public dampeningFactor = NORMAL_DAMPENING_FACTOR; // slows down the speed to prevent nausea

  // public exitingXR$;
  // public enteringXR$;
  public subscriptions: Subscription[] = [];

  init(context: Context) {
    this.context = context;

    this.context.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.ENTERING_XR))
      .subscribe(() => {
        this.setupFlight();
      });

    this.context.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR))
      .subscribe(() => {
        this.tearDownFlight();
      });
  }

  setupFlight() {
    const sub1 = this.context.signalHub.movement
      .on("left_trigger_squeezed")
      .subscribe(() => {
        this.dampeningFactor = GO_FASTER_DAMPENING;
      });
    const sub2 = this.context.signalHub.movement
      .on("left_trigger_released")
      .subscribe(() => {
        this.dampeningFactor = NORMAL_DAMPENING_FACTOR;
      });

    const sub3 = this.context.signalHub.movement
      .on("left_axes")
      .subscribe((axes) => {
        this.forwardVelocity = -axes.y;
        this.sideVelocity = axes.x;
      });
    // let localDirection = BABYLON.Vector3.Zero();
    const systemXR = this.context.systems["xr"] as SystemXR;
    const frame$ = makeXRFrameSignal(systemXR.xrHelper);
    const sub4 = frame$.subscribe(() => {
      const camera = this.context.scene.activeCamera as BABYLON.WebXRCamera;
      if (!camera._localDirection) {
        // undefined for 1 frame?
        return;
      }
      const speed = camera._computeLocalCameraSpeed() * this.dampeningFactor;
      // check input and move camera
      camera._localDirection
        .copyFromFloats(this.sideVelocity, 0, this.forwardVelocity)
        .scaleInPlace(speed);

      camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
      BABYLON.Vector3.TransformNormalToRef(
        camera._localDirection,
        camera._cameraTransformMatrix,
        camera._transformedDirection
      );
      camera.position.addInPlace(camera._transformedDirection);
    });

    this.subscriptions.push(sub1);
    this.subscriptions.push(sub2);
    this.subscriptions.push(sub3);
    this.subscriptions.push(sub4);
  }
  tearDownFlight() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
