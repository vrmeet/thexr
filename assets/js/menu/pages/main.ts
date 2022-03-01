import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

import { CollaborativeEditManager } from '../../collaborative-edit-manager'
import { signalHub } from '../../signalHub';

import '../helpers'
import { span, a, div, toggle } from '../helpers';
import type { stateType } from '../menu-manager'

export class MenuPageMain extends GUI.Container {
    // public editManager: CollaborativeEditManager
    constructor(public scene: BABYLON.Scene, public state: stateType) {
        super()


        // this.editManager = new CollaborativeEditManager(this.scene, this.state)
        this.addControl(
            div({ name: "main-page-container" },
                "Main Menu",
                a({ callback: this.cb("goto_about") }, "About"),
                this.editElement(),
                a({ callback: this.cb("goto_logs") }, "Logs"),
                a({ callback: this.cb("goto_primitives") }, "Primitives"),
            ))
    }

    cb(dest: string) {
        return () => { signalHub.emit('menu_action', { name: dest }) }
    }

    editElement() {
        let editToggle = toggle({ value: (this.state.editing ? 1 : 0) }) as unknown as GUI.Slider
        const callback = data => {
            if (data == 0) {
                signalHub.emit('editing', false)
                // console.log('off')
                // this.state.editing = false
                // this.editManager.off()
            } else {
                // console.log('on')
                // this.state.editing = true
                // this.editManager.on()
                signalHub.emit('editing', true)
            }
        }
        editToggle.onValueChangedObservable.add(callback)
        this.onDisposeObservable.add(() => {
            editToggle.onValueChangedObservable.removeCallback(callback)
        })
        return span({}, "Edit", editToggle as unknown as GUI.Container)


    }







}