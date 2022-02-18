import type * as BABYLON from 'babylonjs'
import { signalHub } from './signalHub'
import { reduceSigFigs } from './utils'
import { Observable } from 'rxjs'

export class XRManager {
    public xrHelper: BABYLON.WebXRDefaultExperience
    public left_input_source: BABYLON.WebXRInputSource
    public right_input_source: BABYLON.WebXRInputSource
    constructor(public scene: BABYLON.Scene) {

    }

    async enableWebXRExperience() {
        try {

            this.xrHelper = await this.scene.createDefaultXRExperienceAsync({})

            //this.teleportationManager = new TeleportationManager(this.signal_hub, this.xrHelper, this.scene)



            this.xrHelper.baseExperience.onStateChangedObservable.add(state => {
                // if (state === WebXRState.ENTERING_XR) {
                //   this.teleporationManager.populateTeleporationWithFloors()
                // }
                // if (state === WebXRState.EXITING_XR) {
                //   this.teleporationManager.unpopulateTeleporationFloors()
                // }
            })


            this.setupEmitCameraMovement()




            // setup each controller
            let xrInput = this.xrHelper.input



            xrInput.onControllerAddedObservable.add(inputSource => {
                if (inputSource.inputSource.handedness === 'left') {
                    this.left_input_source = inputSource
                } else {
                    this.right_input_source = inputSource
                }
                inputSource.onMotionControllerInitObservable.add(abstractMotionController => {
                    this.initController(inputSource, abstractMotionController)
                })
            })


        } catch (e) {
            console.log(e, "web XR is not supported")
        }
    }

    setupEmitCameraMovement() {
        this.xrHelper.baseExperience.camera.onViewMatrixChangedObservable.add(cam => {
            let posArray = cam.position.asArray().map(reduceSigFigs)
            let rotArray = cam.absoluteRotation.asArray().map(reduceSigFigs)
            signalHub.next({ event: "camera_moved", payload: { pos: posArray, rot: rotArray } })
        })
    }

    initController(inputSource: BABYLON.WebXRInputSource, motionController: BABYLON.WebXRAbstractMotionController) {
        // this.setupSendHandPosRot(inputSource)
        this.setupSendComponentData(motionController)
        const payload = {
            hand: motionController.handedness
        }
        signalHub.next({ event: "controller_ready", payload })
    }

    setupSendHandPosRot(inputSource: BABYLON.WebXRInputSource) {
        this.xrHelper.baseExperience.sessionManager.onXRFrameObservable.add(() => {
            signalHub.next({ event: "hand_movement", payload: { hand: inputSource.inputSource.handedness, pos: inputSource.pointer.position.asArray(), rot: inputSource.pointer.rotationQuaternion.asArray() } })
        })
    }

    setupSendComponentData(motionController: BABYLON.WebXRAbstractMotionController) {
        const componentTypes: BABYLON.MotionControllerComponentType[] = ['trigger', 'squeeze', 'button']
        componentTypes.forEach(componentType => {
            let webXRComponent = motionController.getComponentOfType(componentType)
            this.publishChanges(motionController, webXRComponent)
        })
    }

    publishChanges(motionController: BABYLON.WebXRAbstractMotionController, component: BABYLON.WebXRControllerComponent) {
        //wrap babylon observable in rxjs observable
        const componentObservable$ = new Observable<any>(subscriber => {
            // wrap the babylonjs observable
            const babylonObserver = component.onButtonStateChangedObservable.add(component => {
                const payload = {
                    hand: motionController.handedness,
                    pressed: component.pressed,
                    touched: component.touched,
                    value: component.value,
                    id: component.id
                }
                subscriber.next({ event: "component_changed", payload })
            })
            return () => {
                component.onButtonStateChangedObservable.remove(babylonObserver)
            }
        })
        componentObservable$.subscribe(data => {
            signalHub.next(data)
        })
    }



}