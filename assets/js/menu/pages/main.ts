import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { signalHub } from '../../signalHub';
import { span, a, div, toggle } from '../helpers';

export class MenuPageMain extends GUI.Container {
    constructor(public scene: BABYLON.Scene) {
        super()


        this.addControl(
            div({ name: "main-page-container" },
                "Main Menu",
                a({ callback: this.cb("about") }, "About"),
                a({ callback: this.cb("logs") }, "Logs"),
                a({ callback: this.cb("tools") }, "Tools"),

            ))
    }

    cb(dest: string) {
        return () => (signalHub.menu.emit("menu_topic", dest))
    }


}