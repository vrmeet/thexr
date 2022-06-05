import type * as BABYLON from "babylonjs"
import type { SceneManager } from "../sceneManager"
import { signalHub } from "../signalHub"
import { filter } from "rxjs/operators"

export class CrowdAgent {
    public crowd: BABYLON.ICrowd
    public scene: BABYLON.Scene
    public navigationPlugin: BABYLON.RecastJSPlugin
    constructor(public sceneManager: SceneManager) {
        this.scene = sceneManager.scene
        this.navigationPlugin = sceneManager.navigationPlugin

        // signalHub.incoming.on("event").pipe(
        //     filter(msg => msg.m === "game_started")
        // ).subscribe(() => {
        //     let enemy = BABYLON.MeshBuilder.CreateBox("enemy", { width: 1, depth: 1, height: 2 }, this.scene)
        //     BABYLON.Tags.AddTagsTo(enemy, "targetable")
        //     enemy.position.y = 1
        //     this.crowd = this.navigationPlugin.createCrowd(10, 0.5, this.scene)
        //     const agentParams = {
        //         radius: 1,
        //         height: 2,
        //         maxAcceleration: 4.0,
        //         maxSpeed: 1.0,
        //         collisionQueryRange: 0.5,
        //         pathOptimizationRange: 0.0,
        //         separationWeight: 1.0
        //     };

        //     let transform = new BABYLON.TransformNode("");
        //     enemy.parent = transform
        //     const agentIndex = this.crowd.addAgent(BABYLON.Vector3.FromArray([0, 1, 0]), agentParams, transform)
        //     enemy.metadata ||= {}
        //     enemy.metadata['agentIndex'] = agentIndex
        //     this.scene.onBeforeRenderObservable.add(() => {
        //         // move agent toward next target
        //         transform.position = this.crowd.getAgentPosition(agentIndex)
        //         let vel = this.crowd.getAgentVelocity(agentIndex);
        //         //crowd.getAgentNextTargetPathToRef(agentIndex, ag.target.position);
        //         if (vel.length() > 0.2) {
        //             vel.normalize();
        //             var desiredRotation = Math.atan2(vel.x, vel.z);
        //             transform.rotation.y = transform.rotation.y + (desiredRotation - transform.rotation.y) * 0.05;
        //         }

        //     })
        //     this.crowd['onReachTargetObservable'].add((agentInfos) => {
        //         //console.log("agent reach destination: ", agentInfos.agentIndex);
        //         signalHub.incoming.emit("event", { m: "member_damaged", p: { member_id: this.sceneManager.member_id } })
        //         signalHub.local.emit("pulse", { hand: "left", intensity: 0.3, duration: 120 })
        //         signalHub.local.emit("pulse", { hand: "right", intensity: 0.3, duration: 120 })
        //     });

        //     // crowd  .add((agentInfos) => {
        //     //     console.log("agent reach destination: ", agentInfos.agentIndex);
        //     // });
        //     setInterval(async () => {
        //         //  console.log("send agent to", this.scene.activeCamera.position)
        //         this.crowd.agentGoto(agentIndex, this.scene.activeCamera.position);


        //     }, 1000)

        // })


    }
}