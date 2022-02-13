import type * as BABYLON from 'babylonjs'
import { signalHub, listen } from "../signalHub";

import { filter } from 'rxjs/operators'
import { MenuPageAbout } from './pages/about'

import { MenuPageMain } from './pages/main'
import { MenuPageEdit } from './pages/edit'

export class MenuManager {
    public currentMenu;
    constructor(public slug: string, public scene: BABYLON.Scene) {
        listen("open_menu").subscribe(msg => {
            if (!msg.payload.target || !this[msg.payload.target]) {
                console.error("Undefined menu link target", msg.payload)
                return
            }
            const replacementMenu = this[msg.payload.target]()

            if (this.currentMenu) {
                this.currentMenu.dispose()
            }
            this.currentMenu = replacementMenu
        })
    }

    about() {
        return new MenuPageAbout("menu-about")
    }

    main() {
        return new MenuPageMain("menu-main")
    }

    edit() {
        return new MenuPageEdit("menu-edit")
    }
}