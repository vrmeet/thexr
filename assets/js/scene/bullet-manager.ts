import * as BABYLON from "babylonjs"
import { filter } from "rxjs/operators"
import { EventName } from "../event-names"
import type { SceneManager } from "../sceneManager"
import { signalHub } from "../signalHub"
import type { event } from "../types"

const FRAME_RATE = 60

export class BulletManager {
    public bulletTrail: BABYLON.IParticleSystem
    public ray: BABYLON.Ray
    public rayHelper: BABYLON.RayHelper

    constructor(public my_member_id: string, public scene: BABYLON.Scene) {
        this.cacheParticleSystem()
        this.ray = new BABYLON.Ray(BABYLON.Vector3.Zero(), BABYLON.Vector3.One(), 1)
        this.rayHelper = new BABYLON.RayHelper(this.ray)
        // for debugging
        // this.rayHelper.show(this.scene, BABYLON.Color3.Red())
        signalHub.incoming.on("event").pipe(
            filter(event => event.m === EventName.entity_trigger_squeezed)
        ).subscribe(mpts => {
            this.fireBullet(mpts.p["member_id"], mpts.p["pos"], mpts.p["direction"], 10)
        })

        // remove agent when fired upon
        signalHub.incoming.on("event").pipe(
            filter(event => event.m === EventName.target_hit)
        ).subscribe(event => {
            this.removeTargetable(event.p["entity_id"], event.p["direction"])
        })

    }
    async cacheParticleSystem() {
        this.bulletTrail = await BABYLON.ParticleHelper.CreateFromSnippetAsync("HYB2FR#51", this.scene, false, "https://www.babylonjs-playground.com/")
        this.bulletTrail.stop()
    }

    /**
     * 
     * @param position 
     * @param direction 
     * @param speed meters per second
     * @param size 1-5 ideally
     * @param distance in meters
     */
    fireBullet(bullet_owner_member_id: string, position: number[], direction: number[], speed: number = 60, size: number = 1, distance: number = 60) {

        let bullet = BABYLON.MeshBuilder.CreateCapsule("bullet", {
            height: size * 0.1,
            radiusTop: size * 0.03, radiusBottom: size * 0.05
        }, this.scene)
        // set bullet position
        bullet.position.fromArray(position)

        let target = bullet.position.add(BABYLON.Vector3.FromArray(direction).scale(distance))
        bullet.lookAt(target, null, BABYLON.Angle.FromDegrees(90).radians())

        let particleSystem = this.bulletTrail.clone("", bullet)
        particleSystem.start()

        const removeBullet = () => {
            particleSystem.stop()
            bullet.visibility = 0
            setTimeout(() => {
                particleSystem.dispose()
                bullet.dispose()
            }, 2000)
        }


        let animation = BABYLON.Animation.CreateAndStartAnimation("animate_bullet", bullet,
            "position", FRAME_RATE, FRAME_RATE * distance / speed, bullet.position, target, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, null, () => {
                removeBullet()
                this.scene.unregisterBeforeRender(checkBulletForIntersect)
            })



        let checkBulletForIntersect = () => {
            this.ray.origin.copyFrom(bullet.position)
            this.ray.direction.fromArray(direction)
            this.ray.origin.addInPlace(this.ray.direction.scale(size * 0.1))
            // the faster the bullet the longer the beam needs to be
            this.ray.length = 2 * speed / distance

            const hitTest = this.scene.pickWithRay(this.ray)
            if (hitTest.pickedMesh) {
                this.scene.unregisterAfterRender(checkBulletForIntersect)
                animation.stop()

                if (this.my_member_id === bullet_owner_member_id) {
                    // check if we hit a member and dish out damage (avatars will have a member_id set in metadata)
                    if (hitTest.pickedMesh.metadata != null && hitTest.pickedMesh.metadata["member_id"] != undefined) {
                        signalHub.outgoing.emit("event", { m: EventName.member_damaged, p: { member_id: hitTest.pickedMesh.metadata["member_id"] } })
                    } else if (<string[]>BABYLON.Tags.GetTags(hitTest.pickedMesh)?.includes("targetable")) {
                        signalHub.incoming.emit("event", { m: EventName.target_hit, p: { entity_id: hitTest.pickedMesh.id, pos: hitTest.pickedPoint.asArray(), direction: direction } })
                        signalHub.outgoing.emit("event", { m: EventName.target_hit, p: { entity_id: hitTest.pickedMesh.id, pos: hitTest.pickedPoint.asArray(), direction: direction } })
                    }
                }

                removeBullet()
            }


        }

        //see if this bullet intersects *any* mesh
        // if (member_id === this.sceneManager.member_id) {
        // each client checks their own bullets
        this.scene.registerBeforeRender(
            checkBulletForIntersect
        )
        // }



    }


    removeTargetable = (entity_id: string, dir: number[]) => {
        const pickedMesh = this.scene.getMeshById(entity_id)
        const direction = BABYLON.Vector3.FromArray(dir)
        if (!pickedMesh) {
            return
        }
        // if is crowdAgent, remove that first, so we can move it freely
        if (pickedMesh.metadata && pickedMesh.metadata.agentName !== undefined) {
            // this.sceneManager.crowdAgent.crowd.removeAgent(pickedMesh.metadata.agentIndex)
            signalHub.local.emit("hud_msg", "an agent is damaged")
            signalHub.local.emit("agent_damaged", { agent_name: pickedMesh.metadata.agentName })
        }
        if (pickedMesh.physicsImpostor) {
            pickedMesh.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero())
            pickedMesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero())
            pickedMesh.physicsImpostor.dispose()
            pickedMesh.physicsImpostor = null
        }
        this.scene.stopAnimation(pickedMesh)
        setTimeout(() => {
            pickedMesh.physicsImpostor = new BABYLON.PhysicsImpostor(pickedMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, friction: 0.8, restitution: 0.5 }, this.scene);
            pickedMesh.physicsImpostor.setLinearVelocity(direction.scale(100))
        }, 50)
        // pickedMesh.physicsImpostor.setAngularVelocity(BABYLON.Vector3.FromArray(mpts.p.av))
        // setTimeout(() => {
        //     const event: event = { m: "entity_deleted", p: { id: pickedMesh.id } }
        //     signalHub.outgoing.emit("event", event)
        //     signalHub.incoming.emit("event", event)
        // }, 5000)
    }

}