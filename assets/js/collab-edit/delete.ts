import { signalHub } from "../signalHub";
import * as BABYLON from 'babylonjs'

export class CollabEditDeleteManager {
    public pointerObs: BABYLON.Observer<BABYLON.PointerInfo>
    constructor(public scene: BABYLON.Scene) {
        signalHub.observables.editing.subscribe(value => {
            if (value === 'delete') {
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
                console.log(evt)
                let mesh = evt.pickInfo.pickedMesh


                if (mesh && BABYLON.Tags.MatchesQuery(mesh, "editable")) {
                    this.deleteMesh(mesh)
                }
            }

        })
    }

    deleteMesh(mesh: BABYLON.AbstractMesh) {
        console.log('attempting to delete', mesh)
        signalHub.outgoing.emit('spaces_api', {
            func: "delete_entity_with_broadcast",
            args: [{ id: mesh.id }],
        });
    }
}