import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { signalHub } from '../../signalHub';
import type { EditMode } from '../../types';


import { div, a } from '../helpers';

export class MenuTools extends GUI.Container {
    public selectedTool: EditMode
    public tools: any
    constructor() {
        super()
        this.selectedTool = signalHub.observables.editing.getValue()
        this.tools = {}
        const backToMainCallback = () => { signalHub.observables.menu_page.next('main') }
        const gotoPrimitiveCallback = () => { signalHub.observables.menu_page.next('primitives') }
        const gotoColorCallback = () => { signalHub.observables.menu_page.next('color') }

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
                makeTool('transform'),
                makeTool('delete'),
                a({ name: "goto-primitives", callback: gotoPrimitiveCallback }, "primitives"),
                a({ name: "goto-color", callback: gotoColorCallback }, "color"),

            )
        )

        this.onDisposeObservable.add(() => {
            signalHub.observables.editing.next(null)
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

        signalHub.observables.editing.next(toolName)

    }



}