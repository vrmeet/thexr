import * as BABYLON from "babylonjs"
import { filter } from "rxjs"
import { EventName } from "../event-names"
import { signalHub } from "../signalHub"
import type { event } from "../types"
import { random_id } from "../utils"

export class AgentManager {
    public agentSpawnPoints: { [name: string]: number[] }
    public agents: { [name: string]: number }
    constructor(public crowd: BABYLON.ICrowd, public scene: BABYLON.Scene) {
        this.agentSpawnPoints = {}
        this.agents = {}

        signalHub.incoming.on("about_agents").subscribe(({ agents }) => {
            agents.forEach(agent => {
                this.createAgent(agent.name, agent.position)
            })
        })

        signalHub.incoming.on("event").pipe(
            filter(event => event.m === EventName.agent_spawned)
        ).subscribe(event => {
            console.log('incoming spawn event', event)
            this.createAgent(event.p["name"], event.p["position"])
        })



        // this.navigationPlugin = sceneManager.navigationPlugin

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

    addAgentSpawnPoint(name: string, position: number[]) {
        this.agentSpawnPoints[name] = position
    }

    startSpawning() {
        // called by leader
        // create an event

        // no-op if no spawn points
        if (Object.keys(this.agentSpawnPoints).length === 0) {
            return
        }
        // TODO: random select, (decision making based on some logic)
        setTimeout(() => {
            const position = Object.values(this.agentSpawnPoints)[0]
            let event: event = { m: EventName.agent_spawned, p: { name: `agent_${random_id(5)}`, position: position } }
            signalHub.outgoing.emit("event", event)
            signalHub.incoming.emit("event", event)

        }, 5000)

    }

    createAgent(agentName: string, position: number[]) {
        const agentParams = {
            radius: 1,
            height: 2,
            maxAcceleration: 4.0,
            maxSpeed: 1.0,
            collisionQueryRange: 0.5,
            pathOptimizationRange: 0.0,
            separationWeight: 1.0
        };
        let enemy = BABYLON.MeshBuilder.CreateBox(`mesh_${agentName}`, { width: 1, depth: 1, height: 2 }, this.scene)
        let transform = new BABYLON.TransformNode(agentName);
        enemy.parent = transform
        const agentIndex = this.crowd.addAgent(BABYLON.Vector3.FromArray(position), agentParams, transform)
        this.agents[agentName] = agentIndex

    }

    deleteAgent(agentName: string) {
        this.crowd.removeAgent(this.agents[agentName])
        delete this.agents[agentName]
    }
}