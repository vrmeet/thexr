import * as BABYLON from "babylonjs";
import { signalHub } from "../signalHub";
import { Observable } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { TeleportationManager } from "./xr-teleportation-manager";
import type { xr_component } from "../types";
import { XRGripManager } from "./xr-grip-manager";

const exitingXR$ = signalHub.local
  .on("xr_state_changed")
  .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR));

export class XRManager {
  public xrHelper: BABYLON.WebXRDefaultExperience;
  public left_input_source: BABYLON.WebXRInputSource;
  public right_input_source: BABYLON.WebXRInputSource;
  //  public inXR: boolean
  public teleportationManager: TeleportationManager;
  public controllerPhysicsFeature: BABYLON.WebXRControllerPhysics;
  constructor(public member_id: string, public scene: BABYLON.Scene) {
    //      this.inXR = false
  }

  enterXR() {
    return this.xrHelper.baseExperience.enterXRAsync(
      "immersive-vr",
      "local-floor" /*, optionalRenderTarget */
    );
  }

  exitXR() {
    return this.xrHelper.baseExperience.exitXRAsync();
  }

  async enableWebXRExperience() {
    if (!navigator["xr"]) {
      return;
    }
    this.xrHelper = await this.scene.createDefaultXRExperienceAsync({});

    this.controllerPhysicsFeature = <BABYLON.WebXRControllerPhysics>(
      this.xrHelper.baseExperience.featuresManager.enableFeature(
        BABYLON.WebXRFeatureName.PHYSICS_CONTROLLERS,
        "latest",
        {
          xrInput: this.xrHelper.input,
          physicsProperties: {
            restitution: 0.5,
            impostorSize: 0.1,
            impostorType: BABYLON.PhysicsImpostor.BoxImpostor,
          },
          enableHeadsetImpostor: false,
        }
      )
    );

    this.teleportationManager = new TeleportationManager(
      this.xrHelper,
      this.scene
    );

    // function added here does not build up when entered and exiting VR
    // multiple times - tested with console.log
    this.xrHelper.baseExperience.onStateChangedObservable.add((state) => {
      // tell menu manager about what kind of menu to load
      signalHub.local.emit("xr_state_changed", state);

      // ENTERING_XR = 0,
      // /**
      //  * Transitioning to non XR mode
      //  */
      // EXITING_XR = 1,
      // /**
      //  * In XR mode and presenting
      //  */
      // IN_XR = 2,
      // /**
      //  * Not entered XR mode
      //  */
      // NOT_IN_XR = 3
    });

    this.setupEmitCameraMovement();

    // setup each controller
    const xrInput = this.xrHelper.input;

    // triggered once per hand
    xrInput.onControllerAddedObservable.add((inputSource) => {
      if (inputSource.inputSource.handedness === "left") {
        this.left_input_source = inputSource;
      } else {
        this.right_input_source = inputSource;
      }
      inputSource.onMotionControllerInitObservable.add(
        (abstractMotionController) => {
          this.initController(inputSource, abstractMotionController);
        }
      );
    });
  }

  setupEmitCameraMovement() {
    this.xrHelper.baseExperience.camera.onViewMatrixChangedObservable.add(
      (cam) => {
        signalHub.movement.emit("camera_moved", {
          pos: cam.position.asArray(),
          rot: cam.absoluteRotation.asArray(),
        });
      }
    );
  }

  setupVibration(motionController: BABYLON.WebXRAbstractMotionController) {
    let inPulse = false;
    signalHub.local
      .on("pulse")
      .pipe(filter((val) => val.hand === motionController.handedness))
      .subscribe(async (val) => {
        if (inPulse) {
          return;
        }
        inPulse = true;
        await motionController.pulse(val.intensity, val.duration);
        inPulse = false;
      });
  }

  initController(
    inputSource: BABYLON.WebXRInputSource,
    motionController: BABYLON.WebXRAbstractMotionController
  ) {
    this.setupSendComponentData(motionController);
    this.setupVibration(motionController);

    new XRGripManager(
      this.member_id,
      this.scene,
      inputSource,
      motionController,
      this.controllerPhysicsFeature.getImpostorForController(inputSource)
    );
    // ,
    //     (inputSource: BABYLON.WebXRInputSource) => {
    //         return this.setupSendHandPosRot(inputSource)
    //     }
    // )
  }

  makeXRFrameSignal() {
    return new Observable<XRFrame>((subscriber) => {
      const obs =
        this.xrHelper.baseExperience.sessionManager.onXRFrameObservable.add(
          (value) => {
            subscriber.next(value);
          }
        );
      return () => {
        this.xrHelper.baseExperience.sessionManager.onXRFrameObservable.remove(
          obs
        );
      };
    });
  }

  // setupSendHandPosRot(inputSource: BABYLON.WebXRInputSource): Subscription {

  //     const hand = inputSource.inputSource.handedness as "left" | "right"
  //     return this.makeXRFrameSignal().pipe(
  //         takeUntil(exitingXR$)
  //     ).subscribe(() => {

  //         signalHub.movement.emit(`${hand}_hand_moved`, {
  //             pos: inputSource.grip.absolutePosition.asArray(),
  //             rot: inputSource.grip.absoluteRotationQuaternion.asArray()
  //         })

  //     })

  // }

  setupSendComponentData(
    motionController: BABYLON.WebXRAbstractMotionController
  ) {
    const componentIds = motionController.getComponentIds();
    componentIds.forEach((componentId) => {
      const webXRComponent = motionController.getComponent(componentId);
      this.publishChanges(motionController, webXRComponent);
    });
  }

  publishChanges(
    motionController: BABYLON.WebXRAbstractMotionController,
    component: BABYLON.WebXRControllerComponent
  ) {
    //wrap babylon observable in rxjs observable
    const hand = motionController.handedness as "left" | "right";
    const componentObservable$ = new Observable<any>((subscriber) => {
      // wrap the babylonjs observable
      const babylonObserver = component.onButtonStateChangedObservable.add(
        (state) => {
          const payload: xr_component = {
            pressed: state.pressed,
            touched: state.touched,
            value: state.value,
            axes: state.axes,
            id: state.id,
          };
          subscriber.next(payload);
        }
      );
      return () => {
        component.onButtonStateChangedObservable.remove(babylonObserver);
      };
    });

    componentObservable$
      .pipe(takeUntil(exitingXR$))
      .subscribe((xr_button_change_evt) => {
        signalHub.movement.emit(
          `${hand}_${component.type}`,
          xr_button_change_evt
        );
      });
  }
}
