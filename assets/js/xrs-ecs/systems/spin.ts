import type { Entity } from "../entity";
import { BaseSystemWithBehaviors, type IBehavior, type ISystem } from "../system";
import * as BABYLON from "babylonjs"

export class SystemSpin extends BaseSystemWithBehaviors implements ISystem {
    name = "spin"
    order = 20
    buildBehavior() {
        return new BehaviorSpin(this)
    }
}

export type SpinType = { speed: number[] };

export class BehaviorSpin implements IBehavior {
    data: SpinType
    entity: Entity
    scene: BABYLON.Scene
    obs: BABYLON.Observer<BABYLON.Scene>
    mesh: BABYLON.AbstractMesh
    constructor(public system: SystemSpin) {
        this.scene = system.xrs.context.scene
    }
    add(entity: Entity, data: SpinType) {
        this.data = data
        this.entity = entity
        this.mesh = this.scene.getMeshByName(this.entity.name)
        const value = this.mesh.rotationQuaternion.toEulerAngles().asArray()
        console.log("starting value", value)
        this.obs = this.scene.onBeforeRenderObservable.add(() => {
            value[0] += this.data.speed[0]
            value[1] += this.data.speed[1]
            value[2] += this.data.speed[2]

            this.mesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(value[0], value[1], value[2])
        })
    }
    update(data: SpinType) {
        this.remove()
        this.add(this.entity, data)
    }
    remove() {
        this.scene.onBeforeRenderObservable.remove(this.obs)
        this.obs = null
    }
}