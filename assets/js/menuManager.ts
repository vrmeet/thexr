import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { signalHub } from './signalHub';
import { filter } from 'rxjs/operators'


export class MenuManager {
    constructor(public slug: string, public scene: BABYLON.Scene) {
        signalHub.pipe(filter(msg => msg.event === 'open_menu')).subscribe(msg => {
            console.log('menu manager received', msg)
            this.openMenu()
        })
        const leftMenuConfig = [
            { label: 'About', click: () => { this.about() } },
            { label: 'Edit', click: () => { this.edit() } }
        ]
        this.buildMenu(leftMenuConfig)

    }

    async about() {

    }
    async edit() {

    }
    buildMenu(items: { label: string, click: () => void }[]) {

        items.forEach(item => {

        })
    }

    getSpace() {
        var query = `query($slug: String!) {
            space(slug: $slug) {
                name
                description
            }
          }`;

        fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { slug: this.slug },
            })
        })
            .then(r => r.json())
            .then(data => console.log('data returned:', data));
    }

    async openContent() {
        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("Content", true, this.scene);
        advancedTexture.idealWidth = 3000;
        var rect1 = new GUI.Rectangle();
        rect1.left = "500px";
        rect1.width = 0.6;
        rect1.height = "600px";
        rect1.cornerRadius = 20;
        rect1.color = "Orange";
        rect1.thickness = 4;
        rect1.background = "green";
        rect1.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
        advancedTexture.addControl(rect1);

    }


    async openMenu() {
        console.log("create menu")
        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
        advancedTexture.idealWidth = 1000;


        var rect1 = new GUI.Rectangle();

        rect1.width = 0.2;
        rect1.height = "200px";
        rect1.cornerRadius = 20;
        rect1.color = "Orange";
        rect1.thickness = 4;
        rect1.background = "green";
        rect1.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
        advancedTexture.addControl(rect1);

        var button1 = GUI.Button.CreateSimpleButton("but1", "About");
        button1.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
        button1.width = "150px"
        button1.height = "40px";
        button1.color = "white";
        button1.cornerRadius = 20;
        button1.background = "green";
        button1.highlightColor = "#FF0000"
        button1.hoverCursor = "pointer";
        button1.isPointerBlocker = true;
        button1.onPointerUpObservable.add(() => {
            this.openContent()
            this.getSpace()
        });
        rect1.addControl(button1)
        //advancedTexture.addControl(button1);

    }
}