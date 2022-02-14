import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { signalHub } from '../../../signalHub'

import { g, a } from '../../helpers';

export class MenuPageTransform extends GUI.Container {
    constructor(public scene: BABYLON.Scene) {
        super()
        this.addControl(
            g(GUI.Rectangle, {},
                a({ target: "edit" }, "< Back"),
                "Select an object to move, rotate or scale it")
        )

        this.onDisposeObservable.add(() => {

        })
    }

}