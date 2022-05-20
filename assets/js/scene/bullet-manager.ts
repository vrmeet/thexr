import * as BABYLON from "babylonjs"
import { signalHub } from "../signalHub"
import type { event } from "../types"

const FRAME_RATE = 60

export class BulletManager {
    public bulletParticle: BABYLON.IParticleSystem
    public ray: BABYLON.Ray
    public rayHelper: BABYLON.RayHelper

    constructor(public scene: BABYLON.Scene) {
        this.createBulletParticle()
        this.ray = new BABYLON.Ray(BABYLON.Vector3.Zero(), BABYLON.Vector3.One(), 1)
        this.rayHelper = new BABYLON.RayHelper(this.ray)
        // for debugging
        // this.rayHelper.show(this.scene, BABYLON.Color3.Red())


    }
    async createBulletParticle() {
        this.bulletParticle = await BABYLON.ParticleHelper.CreateFromSnippetAsync("HYB2FR#51", this.scene, false, "https://www.babylonjs-playground.com/")
        this.bulletParticle.stop()
    }

    /**
     * 
     * @param position 
     * @param direction 
     * @param speed meters per second
     * @param size 1-5 ideally
     * @param distance in meters
     */
    fireBullet(position: number[], direction: number[], speed: number = 60, size: number = 1, distance: number = 60) {

        let bullet = BABYLON.MeshBuilder.CreateCapsule("bullet", {
            height: size * 0.1,
            radiusTop: size * 0.03, radiusBottom: size * 0.05
        }, this.scene)
        // set bullet position
        bullet.position.fromArray(position)

        let target = bullet.position.add(BABYLON.Vector3.FromArray(direction).scale(distance))
        bullet.lookAt(target, null, BABYLON.Angle.FromDegrees(90).radians())

        let system = this.bulletParticle.clone("", bullet)
        system.start()

        const removeBullet = () => {
            system.stop()
            bullet.visibility = 0
            setTimeout(() => {
                system.dispose()
                bullet.dispose()
            }, 2000)
        }


        let animation = BABYLON.Animation.CreateAndStartAnimation("bullet", bullet,
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
            if (hitTest.pickedMesh && <string[]>BABYLON.Tags.GetTags(hitTest.pickedMesh)?.includes("targetable")) {
                this.scene.unregisterAfterRender(checkBulletForIntersect)
                animation.stop()
                hitTest.pickedMesh.physicsImpostor = new BABYLON.PhysicsImpostor(hitTest.pickedMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, friction: 0.8, restitution: 0.5 }, this.scene);
                hitTest.pickedMesh.physicsImpostor.setLinearVelocity(this.ray.direction.scale(100))
                // hitTest.pickedMesh.physicsImpostor.setAngularVelocity(BABYLON.Vector3.FromArray(mpts.p.av))
                setTimeout(() => {
                    const event: event = { m: "entity_deleted", p: { id: hitTest.pickedMesh.id } }
                    signalHub.outgoing.emit("event", event)
                    signalHub.incoming.emit("event", event)
                }, 5000)

                removeBullet()
            }


        }

        this.scene.registerBeforeRender(
            checkBulletForIntersect
        )



    }
}