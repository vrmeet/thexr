import * as BABYLON from 'babylonjs'
import { signalHub } from './signalHub'
import { reduceSigFigs } from './utils'
import { Observable, single } from 'rxjs'
import { TeleportationManager } from './teleportation-manager'

export class XRManager {
    public xrHelper: BABYLON.WebXRDefaultExperience
    public left_input_source: BABYLON.WebXRInputSource
    public right_input_source: BABYLON.WebXRInputSource
    public inXR: boolean
    public teleportationManager: TeleportationManager
    constructor(public scene: BABYLON.Scene) {
        this.inXR = false
    }

    async enableWebXRExperience() {
        try {

            this.xrHelper = await this.scene.createDefaultXRExperienceAsync({})

            this.teleportationManager = new TeleportationManager(this.xrHelper, this.scene)



            this.xrHelper.baseExperience.onStateChangedObservable.add(state => {
                signalHub.emit('xr_state_changed', state)
                //signalHub.next({ event: 'xr_state_change', payload: { state } })

                //console.log('xr state', state)
                switch (state) {
                    case BABYLON.WebXRState.IN_XR:
                        this.inXR = true;
                        break;
                    case BABYLON.WebXRState.NOT_IN_XR:
                        this.inXR = false;
                        break;
                }
                // if (state === BABYLON.WebXRState.ENTERING_XR) {
                //     //   this.teleporationManager.populateTeleporationWithFloors()
                // }
                // if (state === BABYLON.WebXRState.EXITING_XR) {
                //     // this.teleporationManager.unpopulateTeleporationFloors()
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
            signalHub.emit('camera_moved', { pos: posArray, rot: rotArray })
            //   signalHub.next({ event: "camera_moved", payload: { pos: posArray, rot: rotArray } })
        })
    }

    initController(inputSource: BABYLON.WebXRInputSource, motionController: BABYLON.WebXRAbstractMotionController) {
        // this.setupSendHandPosRot(inputSource)
        this.setupSendComponentData(motionController)
        const payload = {
            hand: motionController.handedness
        }
        //signalHub.next({ event: "controller_ready", payload })
        signalHub.emit('controller_ready', payload)
    }

    setupSendHandPosRot(inputSource: BABYLON.WebXRInputSource) {
        this.xrHelper.baseExperience.sessionManager.onXRFrameObservable.add(() => {
            signalHub.emit('hand_movement', { hand: inputSource.inputSource.handedness, pos: inputSource.pointer.position.asArray(), rot: inputSource.pointer.rotationQuaternion.asArray() })
            //  signalHub.next({ event: "hand_movement", payload: { hand: inputSource.inputSource.handedness, pos: inputSource.pointer.position.asArray(), rot: inputSource.pointer.rotationQuaternion.asArray() } })
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
                subscriber.next(payload)
            })
            return () => {
                component.onButtonStateChangedObservable.remove(babylonObserver)
            }
        })
        componentObservable$.subscribe(payload => {
            signalHub.emit('xr_component_changed', payload)
        })
    }



}