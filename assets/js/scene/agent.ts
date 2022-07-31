/*
can represent an enemy or npc
*/
import * as BABYLON from "babylonjs"
import { EventName } from "../event-names"

import { filter } from "rxjs"
import { signalHub } from "../signalHub"
import type { event } from "../types"
import { mode } from "../mode"
import { Subject } from "rxjs"



export class Agent {
    public body: BABYLON.AbstractMesh
    public transform: BABYLON.TransformNode
    public locked: boolean
    public animatable: BABYLON.Animatable
    public ray: BABYLON.Ray
    public rayHelper: BABYLON.RayHelper
    public bus: Subject<any>
    public interval
    public coneOfSight: BABYLON.AbstractMesh

    public speed: number // meters per second
    constructor(public name: string, public position: number[], public scene: BABYLON.Scene) {
        this.locked = false
        this.bus = new Subject()
        this.speed = 1.5
        this.createBody()

        this.resume()

        this.receiveMovementEvent()
        this.receiveStoppedEvent()
        this.receiveAttackedMemberEvent()

        this.startLeaderEventLoop()
        this.teleportTo(BABYLON.Vector3.FromArray(position))

    }



    resume() {
        this.interval = setInterval(() => {
            if (this.locked || !mode.leader) {
                return
            }
            this.bus.next("update")

        }, 1000) // check if you become the leader
    }

    pause() {
        if (this.interval) {
            clearInterval(this.interval)
        }
    }


    forwardRay(length: number = 1.5) {
        this.ray.origin.copyFrom(this.transform.position)
        this.ray.origin.y += 1
        this.ray.direction.copyFrom(this.transform.forward)
        this.ray.origin.addInPlace(this.transform.forward.scale(0.51))
        this.ray.length = length
        return this.ray
    }

    floorDetectionRay() {
        this.ray.origin = this.transform.position.add(this.transform.forward)
        this.ray.origin.y += 0.5
        this.ray.direction = BABYLON.Vector3.Down()
        return this.ray
    }

    /*
    on the leader client, motion will be broadcast to all clients about this agent
    */
    startLeaderEventLoop() {
        this.bus.subscribe(async evt => {
            if (evt === "update") {
                if (this.locked || !mode.leader) {
                    return
                }

                this.locked = true
                // attack if there is an avatar right in front of us
                let member_id = this.anAvatarIsInfront()
                if (member_id) {
                    console.log("avatar", member_id, "is in front in the update")

                    this.createAttackEvent(member_id)
                    this.createDamageEvent(member_id)

                    return
                }


                // otherwise go someplace new if we can, or just sit here
                let randomPoint = this.eligibleAvatarLocation() || this.randomPointOrNull()

                if (randomPoint) {
                    this.createMovementEvent(randomPoint)
                } else {
                    this.locked = false
                    // wait until next event loop
                }
            }

        })
    }

    // redirect movement message to our event loop
    receiveMovementEvent() {
        signalHub.incoming.on("event").pipe(
            filter(evt => evt.m === EventName.agent_directed),
            filter(evt => evt.p["name"] === this.name)
        ).subscribe(evt => {
            this.goTo(BABYLON.Vector3.FromArray(evt.p["next_position"]))
        })
    }

    receiveAttackedMemberEvent() {
        signalHub.incoming.on("event").pipe(
            filter(evt => evt.m === EventName.agent_attacked_member),
            filter(evt => evt.p["name"] === this.name)
        ).subscribe(evt => {
            console.log("receive attack event and unlocking!")
            if (mode.leader) {
                this.locked = false
                this.createDamageEvent(evt.p["member_id"])
            }
        })
    }

    receiveStoppedEvent() {
        signalHub.incoming.on("event").pipe(
            filter(evt => evt.m === EventName.agent_stopped),
            filter(evt => evt.p["name"] === this.name)
        ).subscribe(evt => {
            this.cancelGoTo()
            this.teleportTo(BABYLON.Vector3.FromArray(evt.p["position"]))
        })
    }

    createStoppedEvent() {
        let evt: event = { m: EventName.agent_stopped, p: { name: this.name, position: this.transform.position.asArray() } }
        signalHub.outgoing.emit("event", evt)
    }

    createAttackEvent(member_id: string) {
        let evt: event = { m: EventName.agent_attacked_member, p: { name: this.name, member_id: member_id } }
        signalHub.outgoing.emit("event", evt)
    }

    createDamageEvent(member_id: string) {
        signalHub.incoming.emit("event", { m: EventName.member_damaged, p: { member_id: member_id } })
        signalHub.outgoing.emit("event", { m: EventName.member_damaged, p: { member_id: member_id } })

    }

    createMovementEvent(nextPosition: BABYLON.Vector3) {
        let evt: event = { m: EventName.agent_directed, p: { name: this.name, position: this.transform.position.asArray(), next_position: nextPosition.asArray() } }
        signalHub.outgoing.emit("event", evt)
    }

    checkIfPointOnMyGround(testX: number, testZ: number) {
        const headPosition = new BABYLON.Vector3(testX, this.transform.position.y + 1, testZ)
        console.log("checking from headPosition of", headPosition)
        const ray = new BABYLON.Ray(headPosition, BABYLON.Vector3.Down(), 1.5)
        this.ray.origin.copyFrom(ray.origin)
        this.ray.direction.copyFrom(ray.direction)
        this.ray.length = ray.length
        // const rayHelper = new BABYLON.RayHelper(ray)
        // rayHelper.show(this.scene, BABYLON.Color3.Red())
        const pickInfo = this.scene.pickWithRay(ray)

        // if the point picked by ray is near the floor we're currently standing on (say within 30 cm height)
        if (pickInfo.hit) {

            let dis = Math.abs(pickInfo.pickedPoint.y - this.transform.position.y)
            console.log("distance with current floor", dis)
            if (dis < 0.3) {
                return pickInfo.pickedPoint.y
            } else {
                return null
            }
        }
    }

    checkIfDestinationHasObstacles(testX: number, testZ: number) {
        const testRay = this.createObstacleRay(new BABYLON.Vector3(testX, this.transform.position.y + 1, testZ))
        const pickInfo = this.scene.pickWithRay(testRay)
        if (pickInfo.hit) {
            return pickInfo
        } else {
            return null
        }
    }

    createObstacleRay(testPoint: BABYLON.Vector3) {
        let origin = this.transform.position.clone()
        origin.y += 1
        const direction = testPoint.subtract(origin).normalize()
        origin.addInPlace(direction.scale(0.6))
        let newRay = BABYLON.Ray.CreateNewFromTo(origin, testPoint)
        this.ray.origin.copyFrom(newRay.origin)
        this.ray.direction.copyFrom(newRay.direction)
        this.ray.length = newRay.length
        return this.ray
    }

    convertDirectionToCoordinate(degree: number, length: number = 10): BABYLON.Vector3 {
        this.ray.origin.copyFrom(this.transform.position)
        this.ray.direction.copyFrom(this.transform.forward)

        let matrix = BABYLON.Matrix.RotationY(BABYLON.Angle.FromDegrees(degree).radians())
        const temp = BABYLON.Ray.Transform(this.ray, matrix)
        this.ray.direction.copyFrom(temp.direction)
        this.ray.length = length

        return this.transform.position.add(this.ray.direction.clone().normalize().scale(length))
    }

    randomSign() {
        return Math.round(Math.random()) * 2 - 1
    }

    checkPointEligible(testPoint: BABYLON.Vector3) {
        let testX = testPoint.x
        let testZ = testPoint.z
        let groundHeight = this.checkIfPointOnMyGround(testX, testZ)
        if (groundHeight) {
            if (!this.checkIfDestinationHasObstacles(testX, testZ)) {
                return new BABYLON.Vector3(testX, groundHeight, testZ)
            }
        }
        return null
    }

    tryToGoForward(maxDistance: number = 8) {
        for (let distance = maxDistance; distance > 3; distance--) {
            let testPoint = this.convertDirectionToCoordinate(0, distance)
            let checkedPoint = this.checkPointEligible(testPoint)
            if (checkedPoint) {
                return checkedPoint
            }
        }
        return null
    }

    scanFromLeft(startingDegree: number, maxDistance: number = 6) {
        for (let degrees = startingDegree; degrees < 150; degrees += 15) {
            for (let distance = 8; distance > 3; distance--) {
                let testPoint = this.convertDirectionToCoordinate(degrees, distance)
                let checkedPoint = this.checkPointEligible(testPoint)
                if (checkedPoint) {
                    return checkedPoint
                }
            }
        }
        return null
    }

    scanFromRight(startingDegree: number, maxDistance: number = 6) {
        for (let degrees = startingDegree; degrees > -150; degrees -= 15) {
            for (let distance = 8; distance > 2; distance--) {
                let testPoint = this.convertDirectionToCoordinate(degrees, distance)
                let checkedPoint = this.checkPointEligible(testPoint)
                if (checkedPoint) {
                    return checkedPoint
                }
            }
        }
        return null
    }

    anAvatarIsInfront() {
        let avatarPositions = this.getAllAvatarHeadPositions()
        for (const [member_id, avatarPosition] of Object.entries(avatarPositions)) {
            if (this.coneOfSight.intersectsPoint(avatarPosition)) {
                return member_id
            }
        }
        return null

    }

    randomPointOrNull() {
        let rand = Math.random()
        if (rand > 0.5) {
            let forwardPoint = this.tryToGoForward()
            if (forwardPoint) {
                return forwardPoint
            }
            return this.scanFromRight(Math.random() * 90 + 5)

        } else if (rand < 0.25) {
            return this.scanFromRight(90)
        } else {
            return this.scanFromLeft(-90)
        }

    }

    stopAnimation() {
        if (this.animatable) {
            this.animatable.stop()
            this.animatable = null
        }
    }

    cancelGoTo() {
        this.stopAnimation()
        this.locked = false
    }

    // return a boolean promise, of true if moved, false if didn't move at all
    goTo(position: BABYLON.Vector3): Promise<boolean> {
        this.locked = true // might already be locked, but in case this is called from somewhere else
        //speed of animation changes with distance, let's say it's one second per meter
        const distance = BABYLON.Vector3.Distance(position, this.transform.position)
        let framesPerSecond = 60
        let totalFrames = (distance / this.speed) * framesPerSecond

        /// set direction of body
        let direction = position.subtract(this.transform.position)
        if (direction.length() > 0.1) {
            let desiredRotationY = Math.atan2(direction.x, direction.z);

            let originalRotationY = this.transform.rotation.y
            // if there is a sign change, subtract a full 360 degress from original so we keep the same sign
            if (desiredRotationY < 0 && originalRotationY > 0) {
                originalRotationY = originalRotationY - 2 * Math.PI
            } else if (desiredRotationY > 0 && originalRotationY < 0) {
                originalRotationY = originalRotationY + 2 * Math.PI
            }
            // if after adjusting, our new originalRotationY is still 180 degrees away, undo the replacement
            if (Math.abs(originalRotationY - desiredRotationY) > Math.PI) {
                originalRotationY = this.transform.rotation.y
            }

            let ease = null
            return new Promise((resolve) => {
                this.animatable = BABYLON.Animation.CreateAndStartAnimation("", this.transform, "rotation.y", 60, 30, originalRotationY, desiredRotationY, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, ease, () => {
                    let sub;
                    // if you are the leader, you dictate all motion including stopping for obstacles or attacking of avatars

                    if (mode.leader) {
                        sub = this.scene.onBeforeRenderObservable.add(() => {
                            let member_id = this.anAvatarIsInfront()
                            if (member_id) {
                                this.createAttackEvent(member_id)
                            }
                            if (member_id || this.somethingIsInfront() || this.ranOutOfFloor()) {
                                this.createStoppedEvent()
                                this.scene.onBeforeRenderObservable.remove(sub)
                                sub = null
                                resolve(false)
                                return
                            }
                        })
                    }
                    this.animatable = BABYLON.Animation.CreateAndStartAnimation("", this.transform, "position", framesPerSecond, totalFrames, this.transform.position, position, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, ease, () => {
                        if (sub) {
                            this.scene.onBeforeRenderObservable.remove(sub)
                        }
                        this.locked = false
                        this.animatable = null
                        resolve(true)
                    })
                })
            })

        } else {
            return new Promise(resolve => { resolve(false) })
        }
    }

    getAllAvatarHeadPositions(): { [member_id: string]: BABYLON.Vector3 } {
        let positions = {}
        // check leader (if not editing)
        if (!mode.editing) {
            positions[this.scene.metadata.member_id] = this.scene.activeCamera.position
        }
        let avatarMeshes = this.scene.getMeshesByTags("avatar")
        for (let i = 0; i < avatarMeshes.length; i++) {
            let avatarMesh = avatarMeshes[i]
            positions[avatarMesh.metadata.member_id] = avatarMesh.position
        }
        return positions
    }

    eligibleAvatarLocation() {
        let eligiblePositions = []
        Object.values(this.getAllAvatarHeadPositions()).forEach(position => {
            let groundPosition = this.checkPointEligible(position)
            if (groundPosition) {
                eligiblePositions.push(groundPosition)
            }
        })
        if (eligiblePositions.length === 1) {
            return eligiblePositions[0];
        }
        if (eligiblePositions.length > 1) {
            return eligiblePositions[Math.floor(Math.random() * eligiblePositions.length)]
        }
        return null
    }

    ranOutOfFloor(): boolean {
        let ray = this.floorDetectionRay()
        let pickInfo = this.scene.pickWithRay(ray)
        return !(pickInfo.pickedMesh && Math.abs(pickInfo.pickedMesh.position.y - this.transform.position.y) < 0.3)
    }

    somethingIsInfront(): boolean {
        let ray = this.forwardRay()
        let pickInfo = this.scene.pickWithRay(ray)
        return !!pickInfo.pickedMesh
    }

    teleportTo(position: BABYLON.Vector3) {
        this.transform.position = position
    }

    createBody() {
        this.ray = new BABYLON.Ray(BABYLON.Vector3.Zero(), BABYLON.Vector3.Forward(), 2)

        this.rayHelper = new BABYLON.RayHelper(this.ray)
        this.rayHelper.show(this.scene, BABYLON.Color3.Red())


        let head = BABYLON.MeshBuilder.CreateCylinder(`head_${this.name}`, { diameterBottom: 0, diameterTop: 0.5, height: 0.8 }, this.scene)
        head.rotation.x = BABYLON.Angle.FromDegrees(90).radians()
        head.position.y = 1.5
        head.metadata = { agentName: this.name }

        this.coneOfSight = BABYLON.MeshBuilder.CreateCylinder(`sight_${this.name}`, { diameterBottom: 0.2, diameterTop: 1, height: 2 }, this.scene)
        this.coneOfSight.rotation.x = BABYLON.Angle.FromDegrees(92).radians()
        this.coneOfSight.position.y = 1.3

        this.coneOfSight.scaling.x = 1.5
        this.coneOfSight.scaling.z = 1.5

        this.coneOfSight.position.z = 1.5
        this.coneOfSight.visibility = 0.5
        this.coneOfSight.isPickable = false

        let body = BABYLON.MeshBuilder.CreateBox(`body_${this.name}`, { width: 1, depth: 1, height: 2 }, this.scene)
        this.body = BABYLON.Mesh.MergeMeshes([head, body], true)
        this.body.metadata = { agentName: this.name }

        BABYLON.Tags.AddTagsTo(this.body, "targetable")
        this.body.id = this.name
        this.body.name = this.name
        this.transform = new BABYLON.TransformNode(`transform_${this.name}`, this.scene);
        this.body.parent = this.transform
        this.coneOfSight.parent = this.body



    }

    dispose() {
        this.pause()
        this.cancelGoTo()
        this.coneOfSight.dispose()
        this.body.dispose()
        this.transform.dispose()
        this.rayHelper.dispose()
    }



}