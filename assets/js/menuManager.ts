import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { signalHub } from './signalHub';
import { filter } from 'rxjs/operators'
export class MenuManager {
    constructor(public scene: BABYLON.Scene) {
        signalHub.pipe(filter(msg => msg.event === 'open_menu')).subscribe(msg => {
            console.log('menu manager received', msg)
            this.openMenu()
        })
    }

    openMenu() {
        GUI.AdvancedDynamicTexture
        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        var button1 = GUI.Button.CreateSimpleButton("but1", "Click Me");
        button1.width = "150px"
        button1.height = "40px";
        button1.color = "white";
        button1.cornerRadius = 20;
        button1.background = "green";
        button1.onPointerUpObservable.add(function () {
            console.log("you did it!");
            advancedTexture.dispose()
        });
        advancedTexture.addControl(button1);

    }
}