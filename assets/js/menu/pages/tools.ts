import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { mode } from '../../mode';
import { signalHub } from '../../signalHub';
import type { EditMode } from '../../types';


import { div, a, pre, toggle, span } from '../helpers';

export class MenuTools extends GUI.Container {
    public selectedTool: EditMode
    public tools: any
    constructor() {
        super()
        this.selectedTool = null
        this.tools = {}
        const backToMainCallback = () => {
            signalHub.menu.emit("menu_topic", "main")
        }
        const gotoPrimitiveCallback = () => { signalHub.menu.emit("menu_topic", 'primitives') }
        const gotoColorCallback = () => { signalHub.menu.emit("menu_topic", 'color') }
        const gotoGameConstructs = () => { signalHub.menu.emit("menu_topic", "gameconstructs") }

        const makeTool = (toolName: EditMode) => {
            const args = {
                name: `select-${toolName}-tool`,
                callback: () => {
                    this.setTool(toolName)
                }
            }
            const tool = a(args, toolName)
            this.tools[toolName] = tool
            return tool
        }

        const editToggle = toggle({ value: (mode.editing) ? 1 : 0 }) as GUI.Slider
        editToggle.onValueChangedObservable.add(data => {
            console.log(data)
            if (data > 0.5) {
                mode.editing = true
            } else {
                mode.editing = false
            }

        })




        this.addControl(
            div({ name: "div-tools" },
                span({},
                    a({ name: "back-to-main", callback: backToMainCallback }, "< Back"),
                    span({ width: "300px" }, editToggle, "Persist Edits")
                ),
                pre({ name: "pre-tools" },
                    span({},
                        makeTool('transform'),
                        makeTool('delete'),
                        a({ name: "goto-color", callback: gotoColorCallback }, "color"),
                    ),
                    a({ name: "goto-primitives", callback: gotoPrimitiveCallback }, "primitives"),
                    a({ name: "goto-game-constructs", callback: gotoGameConstructs }, "game constructs"),

                )
            )
        )

        this.onDisposeObservable.add(() => {
            signalHub.menu.emit("menu_editing_tool", null)
        })


    }

    setTool(toolName: EditMode) {
        console.log('settool', toolName)
        if (this.selectedTool) {
            if (this.selectedTool === toolName) {
                return
            }
            this.tools[this.selectedTool].background = "#EEEEEE"
        }
        this.selectedTool = toolName
        this.tools[this.selectedTool].background = "#FF0000"
        signalHub.menu.emit("menu_editing_tool", toolName)

    }



}