"use strict";
exports.__esModule = true;
exports.FreeCameraKeyboardFlyingInput = void 0;
// import { serialize } from "../../Misc/decorators";
// import { Observer } from "../../Misc/observable";
// import { Nullable } from "../../types";
// import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
// import { FreeCamera } from "../../Cameras/freeCamera";
// import { KeyboardInfo, KeyboardEventTypes } from "../../Events/keyboardEvents";
// import { Scene } from "../../scene";
// import { Vector3 } from "../../Maths/math.vector";
// import { Engine } from "../../Engines/engine";
// import { Tools } from "../../Misc/tools";
var BABYLON = require("babylonjs");
/**
 * Manage the keyboard inputs to control the movement of a free camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
var FreeCameraKeyboardFlyingInput = /** @class */ (function () {
    function FreeCameraKeyboardFlyingInput() {
        /**
         * Gets or Set the list of keyboard keys used to control the forward move of the camera.
         */
        this.keysForward = [38];
        /**
         * Gets or Set the list of keyboard keys used to control the upward move of the camera.
         */
        this.keysUpward = [87];
        /**
         * Gets or Set the list of keyboard keys used to control the backward move of the camera.
         */
        this.keysBackward = [40];
        /**
         * Gets or Set the list of keyboard keys used to control the downward move of the camera.
         */
        this.keysDownward = [83];
        /**
         * Gets or Set the list of keyboard keys used to control the left strafe move of the camera.
         */
        this.keysLeft = [65];
        /**
         * Gets or Set the list of keyboard keys used to control the right strafe move of the camera.
         */
        this.keysRight = [68];
        this.keysRotateLeft = [37];
        this.keysRotateRight = [39];
        this.rotationSpeed = 5;
        this._keys = new Array();
    }
    FreeCameraKeyboardFlyingInput.prototype.myKeysMatched = function (keyCode) {
        return this.keysForward.indexOf(keyCode) !== -1 ||
            this.keysBackward.indexOf(keyCode) !== -1 ||
            this.keysLeft.indexOf(keyCode) !== -1 ||
            this.keysRight.indexOf(keyCode) !== -1 ||
            this.keysUpward.indexOf(keyCode) !== -1 ||
            this.keysDownward.indexOf(keyCode) !== -1 ||
            this.keysRotateLeft.indexOf(keyCode) !== -1 ||
            this.keysRotateRight.indexOf(keyCode) !== -1;
    };
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    FreeCameraKeyboardFlyingInput.prototype.attachControl = function (noPreventDefault) {
        var _this = this;
        noPreventDefault = BABYLON.Tools.BackCompatCameraNoPreventDefault(arguments);
        if (this._onCanvasBlurObserver) {
            return;
        }
        this._scene = this.camera.getScene();
        this._engine = this._scene.getEngine();
        this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(function () {
            _this._keys = [];
        });
        this._onKeyboardObserver = this._scene.onKeyboardObservable.add(function (info) {
            var evt = info.event;
            if (!evt.metaKey) {
                if (info.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                    if (_this.myKeysMatched(evt.keyCode)) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index === -1) {
                            _this._keys.push(evt.keyCode);
                            // if (evt.repeat === false && this.keysForward.indexOf(evt.keyCode) !== -1) {
                            //   let pos = this.camera.position
                            //   // this.eventBus.emit("i_walk_forward_start", [pos.x, pos.y, pos.z])
                            //}
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
                else {
                    if (_this.myKeysMatched(evt.keyCode)) {
                        //this.keysForward.indexOf(evt.keyCode) !== -1 || this.keysBackward.indexOf(evt.keyCode) !== -1 || this.keysLeft.indexOf(evt.keyCode) !== -1 || this.keysRight.indexOf(evt.keyCode) !== -1 || this.keysUpward.indexOf(evt.keyCode) !== -1 || this.keysDownward.indexOf(evt.keyCode) !== -1) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index >= 0) {
                            _this._keys.splice(index, 1);
                            // if (this.keysForward.indexOf(evt.keyCode) !== -1) {
                            // let pos = this.camera.position
                            // this.eventBus.emit("i_walk_forward_stop", [pos.x, pos.y, pos.z])
                            // }
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
            }
        });
    };
    /**
     * Detach the current controls from the specified dom element.
     * @param ignored defines an ignored parameter kept for backward compatibility. If you want to define the source input element, you can set engine.inputElement before calling camera.attachControl
     */
    FreeCameraKeyboardFlyingInput.prototype.detachControl = function (ignored) {
        if (this._scene) {
            if (this._onKeyboardObserver) {
                this._scene.onKeyboardObservable.remove(this._onKeyboardObserver);
            }
            if (this._onCanvasBlurObserver) {
                this._engine.onCanvasBlurObservable.remove(this._onCanvasBlurObserver);
            }
            this._onKeyboardObserver = null;
            this._onCanvasBlurObserver = null;
        }
        this._keys = [];
    };
    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    FreeCameraKeyboardFlyingInput.prototype.checkInputs = function () {
        if (this._onKeyboardObserver) {
            var camera = this.camera;
            // Keyboard
            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];
                var speed = camera._computeLocalCameraSpeed();
                /*
                if (this.keysLeft.indexOf(keyCode) !== -1) {
                                    camera._localDirection.copyFromFloats(-speed, 0, 0);
                                } else if (this.keysUp.indexOf(keyCode) !== -1) {
                                    camera._localDirection.copyFromFloats(0, 0, speed);
                                } else if (this.keysRight.indexOf(keyCode) !== -1) {
                                    camera._localDirection.copyFromFloats(speed, 0, 0);
                                } else if (this.keysDown.indexOf(keyCode) !== -1) {
                                    camera._localDirection.copyFromFloats(0, 0, -speed);
                                } else if (this.keysUpward.indexOf(keyCode) !== -1) {
                                    camera._localDirection.copyFromFloats(0, speed, 0);
                                } else if (this.keysDownward.indexOf(keyCode) !== -1) {
                                    camera._localDirection.copyFromFloats(0, -speed, 0);
                                } else if (this.keysRotateLeft.indexOf(keyCode) !== -1) {
                                    camera._localDirection.copyFromFloats(0, 0, 0);
                                    camera.cameraRotation.y -= this._getLocalRotation();
                                } else if (this.keysRotateRight.indexOf(keyCode) !== -1) {
                                    camera._localDirection.copyFromFloats(0, 0, 0);
                                    camera.cameraRotation.y += this._getLocalRotation();
                                }
                
                */
                if (this.keysRotateLeft.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, 0, 0);
                    camera.cameraRotation.y -= this._getLocalRotation();
                }
                else if (this.keysRotateRight.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, 0, 0);
                    camera.cameraRotation.y += this._getLocalRotation();
                }
                else if (this.keysLeft.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(-speed, 0, 0);
                }
                else if (this.keysRight.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(speed, 0, 0);
                }
                else if (this.keysForward.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, 0, speed);
                }
                else if (this.keysBackward.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, 0, -speed);
                }
                else if (this.keysUpward.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, speed, 0);
                }
                else if (this.keysDownward.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, -speed, 0);
                }
                if (camera.getScene().useRightHandedSystem) {
                    camera._localDirection.z *= -1;
                }
                /*
                camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                        Vector3.TransformNormalToRef(camera._localDirection, camera._cameraTransformMatrix, camera._transformedDirection);
                        camera.cameraDirection.addInPlace(camera._transformedDirection);
                */
                camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                BABYLON.Vector3.TransformNormalToRef(camera._localDirection, camera._cameraTransformMatrix, camera._transformedDirection);
                camera.cameraDirection.addInPlace(camera._transformedDirection);
            }
        }
    };
    /**
     * Gets the class name of the current intput.
     * @returns the class name
     */
    FreeCameraKeyboardFlyingInput.prototype.getClassName = function () {
        return "FreeCameraKeyboardFlyingInput";
    };
    /** @hidden */
    FreeCameraKeyboardFlyingInput.prototype._onLostFocus = function () {
        this._keys = [];
    };
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    FreeCameraKeyboardFlyingInput.prototype.getSimpleName = function () {
        return "keyboard";
    };
    FreeCameraKeyboardFlyingInput.prototype._getLocalRotation = function () {
        var rotation = this.rotationSpeed * this._engine.getDeltaTime() / 1000;
        if (this.camera.getScene().useRightHandedSystem) {
            rotation *= -1;
        }
        if (this.camera.parent && this.camera.parent._getWorldMatrixDeterminant() < 0) {
            rotation *= -1;
        }
        return rotation;
    };
    return FreeCameraKeyboardFlyingInput;
}());
exports.FreeCameraKeyboardFlyingInput = FreeCameraKeyboardFlyingInput;
BABYLON.CameraInputTypes["FreeCameraKeyboardFlyingInput"] = FreeCameraKeyboardFlyingInput;
