import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import type { LogManager } from '../../log-manager';
import { signalHub } from '../../signalHub';

import { pre, a, div, g } from '../helpers';

export class MenuPageLogs extends GUI.Container {
    public textBlock: GUI.TextBlock
    constructor(public logManager: LogManager) {
        super()
        this.name = "menu_page_logs"
        this.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
        this.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
        const callback = () => { signalHub.emit('menu_action', { name: "goto_main" }) }

        this.addControl(
            div({ name: "logs_div" },
                a({ name: "back_to_main", callback }, "< Back"),
                pre({ name: "logs_scroll_view" }, this.getLogs())
            )
        )
        const subscription = signalHub.on('new_log').subscribe(() => {
            this.textBlock.text = this.logManager.recentLogsAsText()
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
                text: this.logManager.recentLogsAsText()
            })
        this.textBlock = text as unknown as GUI.TextBlock
        return text
    }


}