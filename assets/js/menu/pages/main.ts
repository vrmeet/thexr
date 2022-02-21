import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

import { CollaborativeEditManager } from '../../collaborative-edit-manager'

import '../helpers'
import { span, a, div, toggle } from '../helpers';

export class MenuPageMain extends GUI.Container {
    public editManager: CollaborativeEditManager
    constructor(public scene: BABYLON.Scene) {
        super()


        this.editManager = new CollaborativeEditManager(this.scene)
        this.addControl(div({},
            "Main Menu",
            a({ msg: { event: "menu_action", payload: { name: "goto_about" } } }, "About"),
            this.editElement(),
        ))
    }

    editElement() {
        let editToggle = toggle({}) as unknown as GUI.Slider
        const callback = data => {
            if (data == 0) {
                console.log('off')
                this.editManager.off()
            } else {
                console.log('on')
                this.editManager.on()
            }
        }
        editToggle.onValueChangedObservable.add(callback)
        this.onDisposeObservable.add(() => {
            console.log('main is disposed')
            editToggle.onValueChangedObservable.removeCallback(callback)
        })
        return span({}, "Edit", editToggle as unknown as GUI.Container)


    }





}