import { filter, map } from "rxjs/operators";
import { signalHub } from "../signalHub";
import * as BABYLON from "babylonjs"
import { EventName } from "../event-names";

const SLIDE_AMOUNT = 2.3
const DURATION = 2000

export class DoorManager {
    public keys: Set<string> // set of key colors I have collected
    public entitiesLocked: Set<string> // set of entities that are currently in motion, so don't allow new events on them
    constructor(public member_id: string, public scene: BABYLON.Scene) {
        this.keys = new Set<string>()
        this.entitiesLocked = new Set<string>()

        /// listen to about_space to see which keys I already have
        signalHub.incoming.on("about_space").subscribe(about_space => {
            // move grabbed entities into the collection of avatars
            for (const [entity_id, event] of Object.entries(about_space.entities)) {
                if (event.m === EventName.entity_collected && event.p.member_id === this.member_id) {
                    let entity = this.scene.getMeshById(event.p.entity_id)
                    if (entity) {
                        let keyType = this.entityIsKey(entity)
                        if (keyType) {
                            this.keys.add(keyType)
                        }
                    }
                }
            }
        })


        // if collecting a key for myself, add to my key collection
        signalHub.incoming.on("event").pipe(
            filter(evt => evt.m === EventName.entity_collected && evt.p.member_id === this.member_id)
        ).subscribe(evt => {
            let collectedMesh = this.scene.getMeshById(evt.p["entity_id"])
            if (collectedMesh) {
                let keyType = this.entityIsKey(collectedMesh)
                if (keyType) {
                    this.keys.add(keyType)
                }
            }
        })

        // lock animation so moving door can't be opened or closed while already moving
        signalHub.incoming.on("event").pipe(
            filter(mpts => mpts.m === EventName.entity_animated_offset)
        ).subscribe(mpts => {
            let mesh = this.scene.getMeshById(mpts.p["entity_id"])
            if (mesh && this.entityIsDoor(mesh)) {
                this.setTimedLockForAnimationOnEntity(mesh.id)
            }
        })


        // if clicking on a door, move it, if I have the key
        signalHub.local.on("pointer_info").pipe(
            filter(info => info.type === BABYLON.PointerEventTypes.POINTERPICK),
            map((info: BABYLON.PointerInfo) => info.pickInfo.pickedMesh),
        ).subscribe(mesh => {
            if (this.entitiesLocked.has(mesh.id)) {
                // entity is locked, so can't touch this right now
                return
            }
            let doorType = this.entityIsDoor(mesh)
            if (doorType) {
                if (!this.closeToDoor(mesh)) {
                    return
                }
                if (this.doorIsOpen(mesh)) {
                    signalHub.outgoing.emit("event", { m: EventName.entity_animated_offset, p: { entity_id: mesh.id, pos: [0, -SLIDE_AMOUNT, 0], duration: DURATION } })
                    signalHub.incoming.emit("event", { m: EventName.entity_animated_offset, p: { entity_id: mesh.id, pos: [0, -SLIDE_AMOUNT, 0], duration: DURATION } })

                } else if (this.canOpenDoorType(doorType)) {

                    signalHub.outgoing.emit("event", { m: EventName.entity_animated_offset, p: { entity_id: mesh.id, pos: [0, SLIDE_AMOUNT, 0], duration: DURATION } })
                    signalHub.incoming.emit("event", { m: EventName.entity_animated_offset, p: { entity_id: mesh.id, pos: [0, SLIDE_AMOUNT, 0], duration: DURATION } })

                }
            }

        })
    }

    setTimedLockForAnimationOnEntity(entity_id) {
        this.entitiesLocked.add(entity_id)
        setTimeout(() => {
            this.entitiesLocked.delete(entity_id)
        }, DURATION)
    }

    closeToDoor(mesh) {
        return mesh.getDistanceToCamera(this.scene.activeCamera) <= 3
    }

    doorIsOpen(mesh: BABYLON.AbstractMesh) {
        return mesh.position.y > this.scene.activeCamera.position.y
    }

    canOpenDoorType(doorType) {
        return (doorType === "door") || (doorType === "red_door" && this.keys.has("red_key")) ||
            (doorType === "blue_door" && this.keys.has("blue_key"))
    }

    entityIsDoor(entity: BABYLON.AbstractMesh) {
        if (entity && entity.metadata && (entity.metadata.type === "door" || entity.metadata.type === "red_door" || entity.metadata.type === "blue_door")) {
            return entity.metadata.type
        } else {
            return null
        }
    }

    entityIsKey(entity: BABYLON.AbstractMesh) {
        if (entity && entity.metadata && (entity.metadata.type === "red_key" || entity.metadata.type === "blue_key")) {
            return entity.metadata.type
        } else {
            return null
        }
    }

    haveKeyForDoor(mesh): boolean {
        return this.keys.has(mesh.metadata.door)
    }
}