import { filter, map } from "rxjs/operators";
import { signalHub } from "../signalHub";
import * as BABYLON from "babylonjs"
import { EventName } from "../event-names";

export class CollectManager {
    constructor(public member_id: string, public scene: BABYLON.Scene) {
        signalHub.local.on("pointer_info").pipe(
            filter(info => info.type === BABYLON.PointerEventTypes.POINTERPICK),
            map((info: BABYLON.PointerInfo) => info.pickInfo.pickedMesh),
            filter(pickedMesh => pickedMesh && BABYLON.Tags.MatchesQuery(pickedMesh, "collectable"))
        ).subscribe(mesh => {
            if (mesh.getDistanceToCamera(this.scene.activeCamera) <= 2) {
                console.log("should collect")
                signalHub.outgoing.emit("event", { m: EventName.entity_collected, p: { member_id: this.member_id, entity_id: mesh.id } })
                signalHub.incoming.emit("event", { m: EventName.entity_collected, p: { member_id: this.member_id, entity_id: mesh.id } })
            }
        })
    }
}