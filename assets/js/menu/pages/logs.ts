import type * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import type { LogManager } from '../../log-manager';

import { pre, a, div, g } from '../helpers';

export class MenuPageLogs extends GUI.Container {
    constructor(public logManager: LogManager) {
        super()
        this.addControl(div({ name: "logs_div" },
            a({ menu_action: { name: "goto_main" } }, "< Back"),
            pre({}, this.getLogs())
        )
        )
    }

    getLogs() {
        return g(GUI.TextBlock, { width: "500px", height: "900px", text: this.logManager.recentLogsAsText() })
    }


}