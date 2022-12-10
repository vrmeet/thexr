import { filter, takeUntil, map, distinctUntilChanged, Observable } from "rxjs";
import type { SignalHub } from "../../signalHub";
import { getPosRot, camPosRot, arrayReduceSigFigs } from "../../utils/misc";
import { isMobileVR } from "../../utils/utils-browser";
import type { Context } from "../context";
import type { ISystem } from "../system";
import type { XRS } from "../xrs";
import * as BABYLON from "babylonjs";

/**
 * Sends all head and controller events into signal hub
 * automatically unsubscribes to observables when leaving XR
 * and recreates observables when controllers are ready again
 */

export class SystemXR implements ISystem {
  public xrs: XRS;
  name = "xr";
  public context: Context;
  public signalHub: SignalHub;
  public scene: BABYLON.Scene;
  public xrHelper: BABYLON.WebXRDefaultExperience;
  public exitingXR$;
  public controllerPhysicsFeature: BABYLON.WebXRControllerPhysics;
  public teleportation: BABYLON.WebXRMotionControllerTeleportation;
  // convenience cache
  public leftInputSource: BABYLON.WebXRInputSource;
  public rightInputSource: BABYLON.WebXRInputSource;

  getHandVelocity(hand: "left" | "right") {
    const inputSource = this[`${hand}InputSource`];
    if (inputSource && this.controllerPhysicsFeature) {
      const imposter =
        this.controllerPhysicsFeature.getImpostorForController(inputSource);
      return {
        av: arrayReduceSigFigs(imposter.getAngularVelocity().asArray()),
        lv: arrayReduceSigFigs(imposter.getLinearVelocity().asArray()),
      };
    }
    // this system is not ready to return a hand velocity for the requester
    return { av: [0, 0, 0], lv: [0, 0, 0] };
  }

  setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
    this.scene = xrs.context.scene;
    this.signalHub = xrs.context.signalHub;
    this.exitingXR$ = this.signalHub.local
      .on("xr_state_changed")
      .pipe(filter((msg) => msg === BABYLON.WebXRState.EXITING_XR));

    this.signalHub.local.on("client_ready").subscribe(async () => {
      this.start();
    });
  }

  async start() {
    await this.enableWebXRExperience();

    // this doesn't work without a one time user interaction
    // that's another reason why start modal is necessary
    if (isMobileVR()) {
      this.enterXR();
    }
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
      // save left and right input sources so that this system can support
      // querying linear and angular velocity
      const hand = inputSource.motionController.handedness;
      this[`${hand}InputSource`] = inputSource;

      inputSource.onMotionControllerInitObservable.add(() => {
        this.initController(inputSource);
      });
    });

    xrInput.onControllerRemovedObservable.add((inputSource) => {
      const hand = inputSource.motionController.handedness;
      this[`${hand}InputSource`] = null;
      this.signalHub.local.emit("controller_removed", {
        hand: inputSource.motionController.handness,
      });
    });
  }

  initController(inputSource: BABYLON.WebXRInputSource) {
    this.setupComponentData(inputSource);
    this.setupVibration(inputSource);
    this.setupHandMotionData(inputSource);
    this.setupCleanPressAndRelease(inputSource);
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

  setupHandMotionData(inputSource: BABYLON.WebXRInputSource) {
    const motionController = inputSource.motionController;
    motionController.onModelLoadedObservable.add((mc) => {
      // const imposter =
      //   this.controllerPhysicsFeature.getImpostorForController(inputSource);

      inputSource.grip.onAfterWorldMatrixUpdateObservable.add(() => {
        const payload: any = getPosRot(inputSource.grip);
        // payload.lv = imposter.getLinearVelocity().asArray();
        // payload.av = imposter.getAngularVelocity().asArray();
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

  setupVibration(inputSource: BABYLON.WebXRInputSource) {
    const motionController = inputSource.motionController;
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
  setupComponentData(inputSource: BABYLON.WebXRInputSource) {
    const componentIds = inputSource.motionController.getComponentIds();
    componentIds.forEach((componentId) => {
      const webXRComponent =
        inputSource.motionController.getComponent(componentId);
      this.publishChanges(inputSource, webXRComponent);
    });
  }

  publishChanges(
    inputSource: BABYLON.WebXRInputSource,
    component: BABYLON.WebXRControllerComponent
  ) {
    //wrap babylon observable in rxjs observable
    const hand = inputSource.motionController.handedness as "left" | "right";

    const componentButtonObservable$ = new Observable<{
      inputSource: BABYLON.WebXRInputSource;
      controllerComponent: BABYLON.WebXRControllerComponent;
    }>((subscriber) => {
      // wrap the babylonjs observable
      const babylonObserver = component.onButtonStateChangedObservable.add(
        (controllerComponent, _state) => {
          // const payload: xr_component = {
          //   pressed: state.pressed,
          //   touched: state.touched,
          //   value: state.value, // x and y go from -1 to 1, but only when button pressed, not for axis changes
          //   axes: state.axes,
          //   id: state.id,
          // };
          subscriber.next({ inputSource, controllerComponent });
        }
      );
      return () => {
        component.onButtonStateChangedObservable.remove(babylonObserver);
      };
    });

    componentButtonObservable$
      .pipe(takeUntil(this.exitingXR$))
      .subscribe((xr_button_change_evt) => {
        //
        this.signalHub.movement.emit(
          `${hand}_${component.type}`,
          xr_button_change_evt
        );
      });

    const componentAxisObservable$ = new Observable<any>((subscriber) => {
      // wrap the babylonjs observable
      const babylonObserver = component.onAxisValueChangedObservable.add(
        (state) => {
          subscriber.next(state);
        }
      );
      return () => {
        component.onAxisValueChangedObservable.remove(babylonObserver);
      };
    });
    componentAxisObservable$
      .pipe(takeUntil(this.exitingXR$))
      .subscribe((axisChange) => {
        this.signalHub.movement.emit(`${hand}_axes`, axisChange);
      });
  }

  setupCleanPressAndRelease(inputSource: BABYLON.WebXRInputSource) {
    const hand = inputSource.motionController.handness as "left" | "right";
    // listen for clean grip and release

    this.signalHub.movement
      .on(`${hand}_squeeze`)
      .pipe(
        takeUntil(this.exitingXR$),
        map((val) => val.controllerComponent.pressed),
        distinctUntilChanged()
      )
      .subscribe((squeezed) => {
        if (squeezed) {
          this.signalHub.movement.emit(`${hand}_grip_squeezed`, inputSource);
        } else {
          this.signalHub.movement.emit(`${hand}_grip_released`, inputSource);
        }
      });

    this.signalHub.movement
      .on(`${hand}_trigger`)
      .pipe(
        takeUntil(this.exitingXR$),
        map((val) => val.controllerComponent.pressed),
        distinctUntilChanged()
      )
      .subscribe((squeezed) => {
        if (squeezed) {
          this.signalHub.movement.emit(`${hand}_trigger_squeezed`, inputSource);
        } else {
          this.signalHub.movement.emit(`${hand}_trigger_released`, inputSource);
        }
      });

    this.signalHub.movement
      .on(`${hand}_button`)
      .pipe(
        takeUntil(this.exitingXR$),
        // map((val) => val.pressed),
        distinctUntilChanged(
          (a, b) =>
            a.controllerComponent.pressed === b.controllerComponent.pressed
        )
      )
      .subscribe((val) => {
        if (val.controllerComponent.pressed) {
          this.signalHub.movement.emit(
            `${hand}_button_down`,
            val.controllerComponent.id
          );
        } else {
          this.signalHub.movement.emit(
            `${hand}_button_up`,
            val.controllerComponent.id
          );
        }
      });
  }
}
