import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { signalHub } from '../../signalHub';
import { span, a, div, toggle } from '../helpers';

export class MenuPageMain extends GUI.Container {
    // public editManager: CollaborativeEditManager
    constructor(public scene: BABYLON.Scene) {
        super()


        // this.editManager = new CollaborativeEditManager(this.scene, this.state)
        this.addControl(
            div({ name: "main-page-container" },
                "Main Menu",
                a({ callback: this.cb("about") }, "About"),
                this.editElement(),
                a({ callback: this.cb("logs") }, "Logs"),
                a({ callback: this.cb("primitives") }, "Primitives"),
            ))
    }

    cb(dest: string) {
        return () => (signalHub.observables.menu_page.next(dest))
    }

    editElement() {
        console.log('initial value of editing at component render for toggle', signalHub.observables.editing.getValue())
        let editToggle = toggle({ value: (signalHub.observables.editing.getValue() ? 1 : 0) }) as unknown as GUI.Slider
        const callback = data => {
            console.log('toggle data is', data)
            if (data == 0) {
                signalHub.observables.editing.next(false)
            } else {
                signalHub.observables.editing.next(true)
            }
        }
        editToggle.onValueChangedObservable.add(callback)
        this.onDisposeObservable.add(() => {
            editToggle.onValueChangedObservable.removeCallback(callback)
        })
        return span({}, "Edit", editToggle as unknown as GUI.Container)

    }







}