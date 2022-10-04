import type { Context } from "../../context";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";
import type { SignalHub } from "../../signalHub";
import { camPosRot, getPosRot } from "../../utils/misc";
import { distinctUntilChanged, filter, map, Observable, takeUntil } from "rxjs";
import type { xr_component } from "../../types";
import { isMobileVR } from "../../utils/utils-browser";

/*
enables the XR experience
sends head motion and hand controller data
*/
export class SystemXR implements ISystem {
  public name = "service-xr";
  public order = 3;
  public context: Context;
  public scene: BABYLON.Scene;
  public xrHelper: BABYLON.WebXRDefaultExperience;
  public exitingXR$;
  public controllerPhysicsFeature: BABYLON.WebXRControllerPhysics;
  public teleportation: BABYLON.WebXRMotionControllerTeleportation;
  public signalHub: SignalHub;
  init(context: Context) {
    this.context = context;
    this.scene = context.scene;
    this.signalHub = context.signalHub;
    this.exitingXR$ = this.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR));

    this.signalHub.local.on("client_ready").subscribe(async () => {
      await this.enableWebXRExperience();

      if (isMobileVR()) {
        this.enterXR();
      }
    });
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

    this.teleportation =
      this.xrHelper.baseExperience.featuresManager.enableFeature(
        BABYLON.WebXRFeatureName.TELEPORTATION,
        "latest" /* or latest */,
        {
          xrInput: this.xrHelper.input,
          floorMeshes: [],
          defaultTargetMeshOptions: {
            teleportationFillColor: "yellow",
            teleportationBorderColor: "green",
            timeToTeleport: 0,
            disableAnimation: true,
            disableLighting: true,
          },
          forceHandedness: "right",
        }
      ) as BABYLON.WebXRMotionControllerTeleportation;
    this.teleportation.rotationEnabled = false;

    // function added here does not build up when entered and exiting VR
    // multiple times - tested with console.log
    this.xrHelper.baseExperience.onStateChangedObservable.add((state) => {
      // tell menu manager about what kind of menu to load
      this.signalHub.local.emit("xr_state_changed", state);

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
      inputSource.onMotionControllerInitObservable.add(
        (abstractMotionController) => {
          this.initController(inputSource, abstractMotionController);
        }
      );
    });
  }

  initController(
    inputSource: BABYLON.WebXRInputSource,
    motionController: BABYLON.WebXRAbstractMotionController
  ) {
    this.setupComponentData(motionController);
    this.setupVibration(motionController);
    this.setupHandMotionData(motionController, inputSource);
    this.setupCleanPressAndRelease(
      motionController.handness as "left" | "right"
    );
    // new XRGripManager(
    //   this.member_id,
    //   this.scene,
    //   inputSource,
    //   motionController,
    //   this.controllerPhysicsFeature.getImpostorForController(inputSource)
    // );
    // ,
    //     (inputSource: BABYLON.WebXRInputSource) => {
    //         return this.setupSendHandPosRot(inputSource)
    //     }
    // )
  }

  setupHandMotionData(
    motionController: BABYLON.WebXRAbstractMotionController,
    inputSource: BABYLON.WebXRInputSource
  ) {
    motionController.onModelLoadedObservable.add((mc) => {
      const imposter =
        this.controllerPhysicsFeature.getImpostorForController(inputSource);

      inputSource.grip.onAfterWorldMatrixUpdateObservable.add(() => {
        const payload: any = getPosRot(inputSource.grip);
        payload.lv = imposter.getLinearVelocity().asArray();
        payload.av = imposter.getAngularVelocity().asArray();
        this.signalHub.movement.emit(
          `${mc.handness as "left" | "right"}_hand_moved`,
          payload
        );
      });

      // inform menu service that the controller is ready to bind a menu
      this.signalHub.local.emit("controller_ready", {
        hand: motionController.handedness,
        grip: inputSource.grip,
      });
    });
  }

  setupEmitCameraMovement() {
    this.xrHelper.baseExperience.camera.onViewMatrixChangedObservable.add(
      (cam) => {
        this.context.signalHub.movement.emit("camera_moved", camPosRot(cam));
      }
    );
  }

  setupVibration(motionController: BABYLON.WebXRAbstractMotionController) {
    let inPulse = false;
    this.signalHub.local
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

  // produces a noisy stream of every button on the controller
  // for every value 0-100
  setupComponentData(motionController: BABYLON.WebXRAbstractMotionController) {
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
      .pipe(takeUntil(this.exitingXR$))
      .subscribe((xr_button_change_evt) => {
        this.signalHub.movement.emit(
          `${hand}_${component.type}`,
          xr_button_change_evt
        );
      });
  }

  setupCleanPressAndRelease(hand: "left" | "right") {
    // listen for clean grip and release

    this.signalHub.movement
      .on(`${hand}_squeeze`)
      .pipe(
        takeUntil(this.exitingXR$),
        map((val) => val.pressed),
        distinctUntilChanged()
      )
      .subscribe((squeezed) => {
        if (squeezed) {
          this.signalHub.movement.emit(`${hand}_grip_squeezed`, true);
        } else {
          this.signalHub.movement.emit(`${hand}_grip_released`, true);
        }
      });

    this.signalHub.movement
      .on(`${hand}_trigger`)
      .pipe(
        takeUntil(this.exitingXR$),
        map((val) => val.pressed),
        distinctUntilChanged()
      )
      .subscribe((squeezed) => {
        if (squeezed) {
          this.signalHub.movement.emit(`${hand}_trigger_squeezed`, true);
        } else {
          this.signalHub.movement.emit(`${hand}_trigger_released`, true);
        }
      });
  }
}
