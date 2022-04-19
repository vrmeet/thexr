import * as BABYLON from 'babylonjs'
import { signalHub } from './signalHub'
import { arrayReduceSigFigs, reduceSigFigs } from './utils'
import { Observable, single } from 'rxjs'
import { TeleportationManager } from './xr-teleportation-manager'
import type { xr_component } from './types'
import type { Orchestrator } from './orchestrator'
import { XRGripManager } from './xr-grip-manager'

export class XRManager {
    public xrHelper: BABYLON.WebXRDefaultExperience
    public left_input_source: BABYLON.WebXRInputSource
    public right_input_source: BABYLON.WebXRInputSource
    public inXR: boolean
    public teleportationManager: TeleportationManager
    public scene: BABYLON.Scene
    constructor(public orchestrator: Orchestrator) {
        this.scene = orchestrator.sceneManager.scene
        this.inXR = false
    }

    async enableWebXRExperience() {
        if (!navigator['xr']) {
            return
        }
        this.xrHelper = await this.scene.createDefaultXRExperienceAsync({})

        this.teleportationManager = new TeleportationManager(this.xrHelper, this.scene)

        // signalHub.local.on('xr_component_changed').subscribe(value => {
        //     console.log('xr_component_changed', value)
        // })
        // signalHub.movement.on("controller_moved").subscribe(value => {
        //     console.log('controller moved', value)
        // })

        this.xrHelper.baseExperience.onStateChangedObservable.add(state => {
            signalHub.local.emit('xr_state_changed', state)

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

    }

    setupEmitCameraMovement() {
        this.xrHelper.baseExperience.camera.onViewMatrixChangedObservable.add(cam => {
            let posArray = cam.position.asArray().map(reduceSigFigs)
            let rotArray = cam.absoluteRotation.asArray().map(reduceSigFigs)

            signalHub.movement.emit("camera_moved", { pos: posArray, rot: rotArray })
        })
    }

    initController(inputSource: BABYLON.WebXRInputSource, motionController: BABYLON.WebXRAbstractMotionController) {
        this.setupSendHandPosRot(inputSource)
        this.setupSendComponentData(motionController)
        new XRGripManager(this.orchestrator, inputSource, motionController)

        const payload = {
            hand: motionController.handedness
        }
        signalHub.local.emit('controller_ready', payload)
    }

    setupSendHandPosRot(inputSource: BABYLON.WebXRInputSource) {
        let lastPos = [0, 0, 0]
        let lastRot = [0, 0, 0, 1]
        let lastSum = 0
        const hand = inputSource.inputSource.handedness as "left" | "right"
        this.xrHelper.baseExperience.sessionManager.onXRFrameObservable.add(() => {
            const newPos = arrayReduceSigFigs(inputSource.pointer.position.asArray())
            const newRot = arrayReduceSigFigs(inputSource.pointer.rotationQuaternion.asArray())
            const newSum = newPos[0] + newPos[1] + newPos[2] + newRot[0] + newRot[1] + newRot[2] + newRot[3]
            if (newSum - lastSum > Math.abs(0.001)) {
                signalHub.movement.emit(`${hand}_hand_moved`, {
                    pos: newPos,
                    rot: newRot
                })
            }
            lastPos = newPos;
            lastRot = newRot;
            lastSum = newSum;
        })
    }

    setupSendComponentData(motionController: BABYLON.WebXRAbstractMotionController) {
        const componentIds = motionController.getComponentIds()
        componentIds.forEach(componentId => {
            const webXRComponent = motionController.getComponent(componentId)
            this.publishChanges(motionController, webXRComponent)
        })
    }

    publishChanges(motionController: BABYLON.WebXRAbstractMotionController, component: BABYLON.WebXRControllerComponent) {
        console.log('binding publishing changes for', component.type, component.id)
        //wrap babylon observable in rxjs observable
        const hand = motionController.handedness as "left" | "right"
        const componentObservable$ = new Observable<any>(subscriber => {
            // wrap the babylonjs observable
            const babylonObserver = component.onButtonStateChangedObservable.add(state => {
                const payload: xr_component = {
                    pressed: state.pressed,
                    touched: state.touched,
                    value: state.value,
                    axes: state.axes,
                    id: state.id
                }
                subscriber.next(payload)
            })
            return () => {
                component.onButtonStateChangedObservable.remove(babylonObserver)
            }
        })
        componentObservable$.subscribe(xr_button_change_evt => {
            console.log('emit', `${hand}_${component.type}`, xr_button_change_evt)
            signalHub.movement.emit(`${hand}_${component.type}`, xr_button_change_evt)
        })
    }



}