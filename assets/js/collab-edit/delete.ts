import { signalHub } from "../signalHub";
import * as BABYLON from 'babylonjs'
import type { event } from '../types'
import { filter } from "rxjs/operators";

export class CollabEditDeleteManager {
    public pointerObs: BABYLON.Observer<BABYLON.PointerInfo>
    constructor(public scene: BABYLON.Scene) {
        signalHub.menu.on("menu_editing_tool").subscribe(editing => {
            if (editing === "delete") {
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
                    this.deleteMesh(mesh)
                }
            }

        })
    }

    deleteMesh(mesh: BABYLON.AbstractMesh) {
        const event: event = { m: "entity_deleted", p: { id: mesh.id } }
        signalHub.outgoing.emit("event", event)
        signalHub.incoming.emit("event", event)

        // console.log('attempting to delete', mesh)
        // signalHub.outgoing.emit('spaces_api', {
        //     func: "delete_entity_with_broadcast",
        //     args: [{ id: mesh.id }],
        // });
    }
}