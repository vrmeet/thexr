import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { signalHub } from '../../signalHub';
import type { EditMode } from '../../types';


import { div, a, pre } from '../helpers';

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
        const gotoWallMaker = () => { signalHub.menu.emit("menu_topic", "wallmaker") }

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



        this.addControl(
            div({ name: "div-tools" },
                a({ name: "back-to-main", callback: backToMainCallback }, "< Back"),

                pre({ name: "pre-tools" },
                    makeTool('transform'),
                    makeTool('delete'),
                    a({ name: "goto-primitives", callback: gotoPrimitiveCallback }, "primitives"),
                    a({ name: "goto-color", callback: gotoColorCallback }, "color"),
                    a({ name: "goto-wall-maker", callback: gotoWallMaker }, "wallmaker")

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