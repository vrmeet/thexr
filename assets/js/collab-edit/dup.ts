import { signalHub } from "../signalHub";
import * as BABYLON from 'babylonjs'
import type { event } from '../types'
import { filter } from "rxjs/operators";
import { EventName } from "../event-names";
import { random_id } from "../utils";
import { v4 as uuidv4 } from "uuid";

export class CollabEditDupManager {
    public pointerObs: BABYLON.Observer<BABYLON.PointerInfo>
    constructor(public scene: BABYLON.Scene) {
        signalHub.menu.on("menu_editing_tool").subscribe(editing => {
            if (editing === "dup") {
                this.on()
            } else {
                this.off()
            }
        })
    }

    off() {
        this.scene.onPointerObservable.remove(this.pointerObs)

    }
    on() {
        // pay attention to click and double click on the scene
        this.pointerObs = this.scene.onPointerObservable.add(evt => {

            if (evt.type === BABYLON.PointerEventTypes.POINTERPICK) {
                let mesh = evt.pickInfo.pickedMesh


                if (mesh && BABYLON.Tags.MatchesQuery(mesh, "editable")) {
                    this.duplicateMesh(mesh)
                }
            }

        })
    }

    duplicateMesh(mesh: BABYLON.AbstractMesh) {
        const entity = mesh.metadata.ref

        const name = `${entity.type}_${random_id(6)}`
        const uuid = uuidv4()

        const entity_event: event = { m: EventName.entity_created, p: { type: entity.type, id: uuid, name, components: entity.components } }

        signalHub.outgoing.emit('event', entity_event)
        signalHub.incoming.emit('event', entity_event)


        // console.log('attempting to delete', mesh)
        // signalHub.outgoing.emit('spaces_api', {
        //     func: "delete_entity_with_broadcast",
        //     args: [{ id: mesh.id }],
        // });
    }
}