import type * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import { signalHub } from "../../signalHub";
import { a, div } from "../helpers";

export class MenuPageMain extends GUI.Container {
  constructor(public scene: BABYLON.Scene) {
    super();

    // const editToggle = toggle({ value: (mode.editing) ? 1 : 0 }) as GUI.Slider
    // editToggle.onValueChangedObservable.add(data => {
    //     console.log(data)
    //     if (data > 0.5) {
    //         mode.editing = true
    //     } else {
    //         mode.editing = false
    //     }
    //     signalHub.menu.emit("menu_topic", "main")
    // })

    // let row;
    // if (mode.editing) {
    //     row = span({}, editToggle, "Editing", a({ callback: this.cb("tools") }, "Tools"))
    // } else {
    //     row = span({}, editToggle, "Editing")
    // }

    this.addControl(
      div(
        { name: "main-page-container" },
        "Main Menu",
        a({ callback: this.cb("about") }, "About"),
        a({ callback: this.cb("logs") }, "Logs"),
        a({ callback: this.cb("tools") }, "Tools")
      )
    );
  }

  cb(dest: string) {
    return () => signalHub.menu.emit("menu_topic", dest);
  }
}
