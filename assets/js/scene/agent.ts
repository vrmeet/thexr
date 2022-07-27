/*
can represent an enemy or npc
*/
import * as BABYLON from "babylonjs"
import { EventName } from "../event-names"
import type { Avatar } from "./avatar"
import { filter } from "rxjs"
import { signalHub } from "../signalHub"
import type { event, member_state } from "../types"
import { random_id, arrayReduceSigFigs, reduceSigFigs } from "../utils"

import { v4 as uuidv4 } from "uuid";
import { mode } from "../mode"
import { member_states } from "../member-states"
import { Subject } from "rxjs"



export class Agent {
    public coneOfSight: BABYLON.AbstractMesh
    public body: BABYLON.AbstractMesh
    public transform: BABYLON.TransformNode
    public locked: boolean
    public animatable: BABYLON.Animatable
    public ray: BABYLON.Ray
    public bus: Subject<any>
    public degreeSamples: number[]

    public speed: number // meters per second
    constructor(public name: string, public position: number[], public scene: BABYLON.Scene) {
        this.locked = false
        this.bus = new Subject()
        this.speed = 1.5
        this.createBody()
        this.degreeSamples = this.degrees()
        setInterval(() => {
            console.log("periodic interval update msg")
            if (mode.leader) {
                this.bus.next("update")
            }
        }, 1000) // check if you become the leader

        this.receiveMovementEvent()
        this.startEventLoop()


    }

    getRandomDegree() {
        return this.degreeSamples[Math.floor(Math.random() * this.degreeSamples.length)]
    }

    forwardRay(length: number = 2) {
        this.ray.origin = this.transform.position.clone()
        this.ray.origin.y += 1
        this.ray.direction = this.transform.forward.clone()
        this.ray.origin.addInPlace(this.ray.direction.scale(1.1))
        this.ray.length = length
        return this.ray
    }

    floorDetectionRay() {
        this.ray.origin = this.transform.position.add(this.transform.forward)
        this.ray.origin.y += 0.5
        this.ray.direction = BABYLON.Vector3.Down()
        return this.ray
    }


    degrees() {
        let mostFreqDegress = [5, 10, 15, 20, 30]
        let lessFreqDegress = [45, 60, 90]
        let samples = []
        mostFreqDegress.forEach(fd => {
            samples.push(fd)
            samples.push(-fd)
            samples.push(fd)
            samples.push(-fd)
        })
        lessFreqDegress.forEach(ld => {
            samples.push(ld)
            samples.push(-ld)
        })
        return samples
    }

    startEventLoop() {
        this.bus.subscribe(async evt => {
            if (evt === "update") {
                if (this.locked || !mode.leader) {
                    return
                }

                this.locked = true
                // go someplace new
                let randomPoint = this.convertDirectionToCoordinate(this.getRandomDegree(), 5)

                this.createMovementEvent(randomPoint)
            } else if (evt === "cancel") {
                this.cancelGoTo()
            } else {
                // response to the direction and move self, if done moving, AND leader, send self an update
                await this.goTo(BABYLON.Vector3.FromArray(evt.p["next_position"]))
                if (mode.leader) {
                    this.bus.next("update")
                }
            }

        })
    }

    // redirect movement message to our event loop
    receiveMovementEvent() {
        signalHub.incoming.on("event").pipe(
            filter(evt => evt.m === EventName.agent_directed),
            filter(evt => evt.p["name"] === this.name)
        ).subscribe(async (evt) => {
            this.bus.next(evt)
        })
    }

    createMovementEvent(nextPosition: BABYLON.Vector3) {
        let evt: event = { m: EventName.agent_directed, p: { name: this.name, position: this.transform.position.asArray(), next_position: nextPosition.asArray() } }
        signalHub.outgoing.emit("event", evt)
    }

    // async update() {
    //     if (this.locked) {
    //         console.log("update locked so returning")
    //         return
    //     }
    //     if (mode.leader) {
    //         this.locked = true
    //         // if we are the leader than animate us somewhere, and at the end of the animation check where to go next
    //         let randomPoint = this.randomPointOrNull()
    //         if (randomPoint) {
    //             console.log("create new movement", randomPoint)
    //             this.createMovementEvent(randomPoint)
    //         } else {
    //             this.locked = false
    //         }
    //     } else {
    //         this.locked = false
    //     }
    // }





    checkIfPointOnMyGround(testX: number, testZ: number) {
        const headPosition = new BABYLON.Vector3(testX, this.transform.position.y + 2, testZ)
        const ray = new BABYLON.Ray(headPosition, BABYLON.Vector3.Down(), 3)
        // const rayHelper = new BABYLON.RayHelper(ray)
        // rayHelper.show(this.scene, BABYLON.Color3.Red())
        const pickInfo = this.scene.pickWithRay(ray)
        // if the point picked by ray is near the floor we're currently standing on (say within 30 cm height)
        return (pickInfo.hit && Math.abs(pickInfo.pickedPoint.y - this.transform.position.y) < 0.3)
    }



    convertDirectionToCoordinate(degree: number, length: number = 10): BABYLON.Vector3 {
        this.ray.origin = this.transform.position.clone()
        this.ray.direction = this.transform.forward.clone()

        let matrix = BABYLON.Matrix.RotationY(BABYLON.Angle.FromDegrees(degree).radians())
        const temp = BABYLON.Ray.Transform(this.ray, matrix)
        this.ray.direction.copyFrom(temp.direction)
        this.ray.length = 10

        return this.transform.position.clone().add(this.ray.direction.scale(length))
    }


    randomPointOrNull(tries = 10) {

        while (tries > 0) {
            let randomDegree = this.getRandomDegree()
            // let x = this.transform.position.x + Math.random() * 10 - 5
            // let z = this.transform.position.z + Math.random() * 10 - 5
            // if (this.checkIfPointOnMyGround(x, z)) {
            //     return new BABYLON.Vector3(x, this.transform.position.y, z)
            // }
            tries -= 1
        }
        return null
    }

    cancelGoTo() {
        if (this.animatable) {
            this.animatable.stop()
            this.animatable = null
        }
        this.locked = false
        this.bus.next("update")
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
            var desiredRotation = Math.atan2(direction.x, direction.z);
            return new Promise((resolve) => {
                this.animatable = BABYLON.Animation.CreateAndStartAnimation("", this.transform, "rotation.y", 60, 30, this.transform.rotation.y, desiredRotation, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
                    const sub = this.scene.onBeforeRenderObservable.add(() => {
                        if (this.ranOutOfFloor() || this.somethingIsInfront()) {
                            this.bus.next("cancel")
                            resolve(false)
                            return
                        }
                    })
                    this.animatable = BABYLON.Animation.CreateAndStartAnimation("", this.transform, "position", framesPerSecond, totalFrames, this.transform.position, position, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
                        this.scene.onBeforeRenderObservable.remove(sub)
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

        const helper = new BABYLON.RayHelper(this.ray)
        helper.show(this.scene, BABYLON.Color3.Red())

        let head = BABYLON.MeshBuilder.CreateCylinder(`head_${this.name}`, { diameterBottom: 0, diameterTop: 0.5, height: 0.8 }, this.scene)
        head.rotation.x = BABYLON.Angle.FromDegrees(90).radians()
        head.position.y = 1.5

        this.coneOfSight = BABYLON.MeshBuilder.CreateCylinder(`sight_${this.name}`, { diameterBottom: 0.2, diameterTop: 8, height: 15 }, this.scene)
        this.coneOfSight.rotation.x = BABYLON.Angle.FromDegrees(92).radians()
        this.coneOfSight.position.y = 1.3
        this.coneOfSight.scaling.x = 2
        this.coneOfSight.scaling.z = 0.5
        this.coneOfSight.position.z = 7
        this.coneOfSight.visibility = 0.5
        this.coneOfSight.isPickable = false

        let body = BABYLON.MeshBuilder.CreateBox(`body_${this.name}`, { width: 1, depth: 1, height: 2 }, this.scene)
        this.body = BABYLON.Mesh.MergeMeshes([head, body], true);
        BABYLON.Tags.AddTagsTo(this.body, "targetable")
        this.body.id = this.name
        this.body.name = this.name
        this.transform = new BABYLON.TransformNode(`transform_${this.name}`, this.scene);
        this.body.parent = this.transform
        this.coneOfSight.parent = this.body



    }

    canSeePosition(position: BABYLON.Vector3) {
        if (this.coneOfSight.intersectsPoint(position)) {
            return position
        }
        return null
    }

    // loops through all avatars and returns first one found that is within the cone of visiblity
    firstSeenAvatar(avatarMeshes: BABYLON.AbstractMesh[]): BABYLON.Vector3 | null {
        for (let i = 0; i < avatarMeshes.length; i++) {
            if (avatarMeshes[i].intersectsMesh(this.coneOfSight)) {
                return avatarMeshes[i].position
            }
        }
        return this.canSeePosition(this.scene.activeCamera.position)
    }

    dispose() {
        this.coneOfSight.dispose()
        this.body.dispose()
        this.transform.dispose()
    }



}