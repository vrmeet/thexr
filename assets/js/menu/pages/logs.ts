import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import type { LogManager } from '../../log-manager';

import { pre, a, div, g } from '../helpers';

export class MenuPageLogs extends GUI.Container {
    constructor(public logManager: LogManager) {
        super()
        this.name = "menu_page_logs"
        this.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
        this.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
        this.addControl(div({ name: "logs_div" },
            a({ menu_action: { name: "goto_main" } }, "< Back"),
            pre({ name: "logs_scroll_view" }, this.getLogs())
        )
        )
    }

    getLogs() {
        return g(GUI.TextBlock, {
            width: 3,
            textHorizontalAlignment: GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
            textVerticalAlignment: GUI.Control.VERTICAL_ALIGNMENT_TOP,
            height: "900px",
            text: this.logManager.recentLogsAsText()
        })
    }


}