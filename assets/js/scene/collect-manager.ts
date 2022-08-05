import { filter, map } from "rxjs/operators";
import { signalHub } from "../signalHub";
import type * as BABYLON from "babylonjs"
import { EventName } from "../event-names";
import { mode } from "../mode";

export class CollectManager {
    constructor(public member_id: string, public scene: BABYLON.Scene) {
        signalHub.local.on("collect_substitute").subscribe(evt => {

            let mesh = this.scene.getMeshById(evt.entity_id)
            if (mesh) {
                signalHub.outgoing.emit("event", { m: EventName.entity_collected, p: { member_id: this.member_id, entity_id: mesh.id } })
                signalHub.incoming.emit("event", { m: EventName.entity_collected, p: { member_id: this.member_id, entity_id: mesh.id } })
            }
        })
    }
}