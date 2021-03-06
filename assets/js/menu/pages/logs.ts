import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import { logManager } from '../../log-manager';
import { signalHub } from '../../signalHub';

import { pre, a, div, g } from '../helpers';

export class MenuPageLogs extends GUI.Container {
    public textBlock: GUI.TextBlock
    constructor() {
        super()
        this.name = "menu_page_logs"
        this.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
        this.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
        const callback = () => {
            signalHub.menu.emit("menu_topic", "main")
        }

        this.addControl(
            div({ name: "logs_div" },
                a({ name: "back_to_main", callback }, "< Back"),
                pre({ name: "logs_scroll_view" }, this.getLogs())
            )
        )
        const subscription = signalHub.local.on('new_log').subscribe(() => {
            this.textBlock.text = logManager.recentLogsAsText()
        })
        this.onDisposeObservable.addOnce(() => {
            subscription.unsubscribe()
        })
    }

    getLogs() {
        const text =
            g(GUI.TextBlock, {
                width: 3,
                textHorizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
                textVerticalAlignment: GUI.Control.VERTICAL_ALIGNMENT_TOP,
                height: "900px",
                text: logManager.recentLogsAsText()
            })
        this.textBlock = text as unknown as GUI.TextBlock
        return text
    }


}