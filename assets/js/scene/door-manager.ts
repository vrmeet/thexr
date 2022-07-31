import { filter, map } from "rxjs/operators";
import { signalHub } from "../signalHub";
import * as BABYLON from "babylonjs"
import { EventName } from "../event-names";

export class DoorManager {
    public keys: Set<string>
    constructor(public member_id: string, public scene: BABYLON.Scene) {
        this.keys = new Set<string>()


        /// listen to about_space to see which keys I already have
        signalHub.incoming.on("about_space").subscribe(about_space => {
            // move grabbed entities into the hands of avatars
            for (const [entity_id, event] of Object.entries(about_space.entities)) {
                if (event.m === EventName.entity_collected && event.p.member_id === this.member_id) {
                    let entity = this.scene.getMeshById(event.p.entity_id)
                    if (entity && entity.metadata && entity.metadata.door) {
                        this.keys.add(entity.metadata.door)
                    }
                }
            }
        })



        signalHub.incoming.on("event").pipe(
            filter(evt => evt.m === EventName.entity_collected && evt.p.member_id === this.member_id)
        ).subscribe(evt => {
            let collectedMesh = this.scene.getMeshById(evt.p["entity_id"])
            if (collectedMesh && collectedMesh.metadata && collectedMesh.metadata.door) {
                this.keys.add(collectedMesh.metadata.door)
            }
        })

        signalHub.local.on("pointer_info").pipe(
            filter(info => info.type === BABYLON.PointerEventTypes.POINTERPICK),
            map((info: BABYLON.PointerInfo) => info.pickInfo.pickedMesh),
            filter(pickedMesh => pickedMesh && pickedMesh.metadata && pickedMesh.metadata.door)
        ).subscribe(mesh => {
            if (mesh.getDistanceToCamera(this.scene.activeCamera) <= 3 && this.haveKeyForDoor(mesh)) {
                signalHub.outgoing.emit("event", { m: EventName.entity_animated_offset, p: { entity_id: mesh.id, pos: [0, 3, 0], duration: 3000 } })
                signalHub.incoming.emit("event", { m: EventName.entity_animated_offset, p: { entity_id: mesh.id, pos: [0, 3, 0], duration: 3000 } })
            }
        })
    }

    haveKeyForDoor(mesh): boolean {
        return this.keys.has(mesh.metadata.door)
    }
}