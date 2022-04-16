

import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import type { Orchestrator } from '../../orchestrator';
import type { SceneManager } from '../../sceneManager';
import { signalHub } from '../../signalHub';
import type { event } from '../../types'

import { div, g, a } from '../helpers';

export class MenuColor extends GUI.Container {
    public pointerObs: BABYLON.Observer<BABYLON.PointerInfo>
    public currentColor: BABYLON.Color3
    sceneManager: SceneManager;
    scene: BABYLON.Scene;
    constructor(public orchestrator: Orchestrator) {
        super()
        this.sceneManager = orchestrator.sceneManager
        this.scene = orchestrator.sceneManager.scene
        this.currentColor = BABYLON.Color3.Red()
        const callback = () => {
            signalHub.menu.emit("menu_topic", "tools")
        }
        this.addControl(
            div({ name: "color_div" },
                a({ name: "back-to-tools", callback }, "< Tools"),
                this.colorPicker())
        )

        // pay attention to click and double click on the scene
        this.pointerObs = this.scene.onPointerObservable.add(evt => {
            if (evt.type === BABYLON.PointerEventTypes.POINTERPICK) {
                let mesh = evt.pickInfo.pickedMesh


                if (mesh && BABYLON.Tags.MatchesQuery(mesh, "editable")) {
                    this.colorMesh(mesh)
                }
            }

        })
        this.onDisposeObservable.add(() => {
            this.scene.onPointerObservable.remove(this.pointerObs)
        })
    }

    colorMesh(mesh: BABYLON.AbstractMesh) {
        const colorString = this.currentColor.toHexString()
        const event: event = { m: "entity_colored", p: { id: mesh.id, color: colorString } }
        signalHub.outgoing.emit("event", event)
        signalHub.incoming.emit("event", event)

        // this.sceneManager.setComponent(mesh,
        //     {
        //         type: 'color',
        //         data: { value: colorString }
        //     }
        // )

        // signalHub.outgoing.emit('spaces_api', {
        //     func: 'modify_component_with_broadcast',
        //     args: [mesh.id, 'color', { value: colorString }]
        // })

    }

    colorPicker() {
        let picker = new GUI.ColorPicker();
        picker.height = "150px";
        picker.width = "150px";
        picker.onValueChangedObservable.add((value) => {
            console.log('color', value)
            this.currentColor = value
        });
        return picker
    }


}