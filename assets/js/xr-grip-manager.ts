import { filter } from "rxjs";
import { signalHub } from "./signalHub";

export class XRGripManager {
    constructor(hand: "left" | "right") {


        signalHub.local.on("xr_component_changed").pipe(
            filter(msg => msg.hand === hand && msg.type === "squeeze" && msg.pressed && msg.touched)
        )
    }
}