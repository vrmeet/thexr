import * as BABYLON from "babylonjs"
import { filter } from "rxjs"
import { EventName } from "../event-names"
import { signalHub } from "../signalHub"
import type { event } from "../types"
import { random_id, arrayReduceSigFigs, reduceSigFigs } from "../utils"

export class AgentManager {
    public agentSpawnPoints: { [name: string]: any }
    public agents: { [name: string]: { agentIndex: number, mesh: BABYLON.AbstractMesh, transform: BABYLON.TransformNode } }
    constructor(public plugin: BABYLON.RecastJSPlugin, public crowd: BABYLON.ICrowd, public scene: BABYLON.Scene) {
        this.agentSpawnPoints = {}
        this.agents = {}

        // creates any previously spawned agents
        signalHub.incoming.on("about_agents").subscribe((payload) => {
            console.log("about_agents", payload)
            Object.entries(payload.agents).forEach(([agentName, agent]) => {
                this.createAgent(agentName, BABYLON.Vector3.FromArray(agent.prev_position))
                this.crowd.agentGoto(this.agents[agentName].agentIndex, BABYLON.Vector3.FromArray(agent.next_position))
            })
        })

        // creates newly spawned agents
        signalHub.incoming.on("event").pipe(
            filter(event => event.m === EventName.agent_spawned)
        ).subscribe(event => {
            console.log('incoming spawn event', event)
            this.createAgent(event.p["name"], BABYLON.Vector3.FromArray(event.p["position"]))
        })

        // move agents
        signalHub.incoming.on("event").pipe(
            filter(event => event.m === EventName.agents_directed)
        ).subscribe(event => {
            // console.log("agents_directed", JSON.stringify(event.p["agents"], null, 2))
            event.p["agents"].forEach(agent => {
                if (this.agents[agent.name]) {
                    setTimeout(() => {
                        if (this.agents[agent.name]) {
                            const agentIndex = this.agents[agent.name].agentIndex
                            const dest = BABYLON.Vector3.FromArray(agent.next_position)
                            this.crowd.agentGoto(agentIndex, dest)
                        }
                    }, agent.delay)
                } else {
                    console.error("missing agent for", agent)
                }
            })


        })

        signalHub.incoming.on("event").pipe(
            filter(event => event.m === EventName.agent_hit)
        ).subscribe(event => {
            const agentName = event.p["name"]
            const direction = BABYLON.Vector3.FromArray(event.p["direction"])
            const pickedPoint = BABYLON.Vector3.FromArray(event.p["pos"])
            this.deleteAgent(agentName)
        })



        // support mesh agent rotation
        this.scene.onBeforeRenderObservable.add(() => {
            Object.values(this.agents).forEach(agentObj => {
                const agentIndex = agentObj.agentIndex
                // const position = this.crowd.getAgentPosition(agentIndex)
                const velocity = this.crowd.getAgentVelocity(agentIndex);
                if (velocity.length() > 0.2) {
                    velocity.normalize();
                    var desiredRotation = Math.atan2(velocity.x, velocity.z);
                    agentObj.mesh.rotation.y = agentObj.mesh.rotation.y + (desiredRotation - agentObj.mesh.rotation.y) * 0.01;
                }
            })
        });



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

    addAgentSpawnPoint(name: string) {
        this.agentSpawnPoints[name] = true
    }

    getRandomAgent() {
        const agentNames = Object.keys(this.agents)
        return agentNames[Math.floor(Math.random() * agentNames.length)]
    }

    sendAgentMovements() {
        if (Object.keys(this.agents).length < 1) {
            return
        }
        const futurePositions = Object.entries(this.agents).map(([agentName, agent]) => {
            const currentPosition = agent.transform.position
            const nextPosition = this.plugin.getRandomPointAround(currentPosition, 2)
            const delay = Math.random() * 500
            return { name: agentName, currentPosition, nextPosition, delay }
        }).map(temp => {
            return {
                name: temp.name,
                prev_position: arrayReduceSigFigs(temp.currentPosition.asArray()),
                next_position: arrayReduceSigFigs(temp.nextPosition.asArray()),
                delay: reduceSigFigs(temp.delay),
            }
        })


        const payload: event = {
            m: EventName.agents_directed,
            p: { agents: futurePositions }
        }
        signalHub.outgoing.emit("event", payload)

    }

    planMovementForAllAgents() {
        this.sendAgentMovements()
        setInterval(() => {
            this.sendAgentMovements()
        }, 5000)
        // setInterval(() => {

        //     Object.keys(this.agents).forEach(agentName => {
        //         const currentPosition = this.crowd.getAgentPosition(this.agents[agentName].agentIndex)
        //         const nextPosition = this.plugin.getRandomPointAround(currentPosition, 3)
        //         const payload: event = {
        //             m: EventName.agent_directed,
        //             p: {
        //                 name: agentName, prev_position: currentPosition.asArray(),
        //                 next_position: nextPosition.asArray()
        //             }
        //         }
        //         signalHub.outgoing.emit("event", payload)
        //         signalHub.incoming.emit("event", payload)
        //     })

        // }, 5000)

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
            const spawnerName = Object.keys(this.agentSpawnPoints)[0]
            const position = this.scene.getMeshByName(spawnerName).position.asArray()
            let event: event = { m: EventName.agent_spawned, p: { name: `agent_${random_id(5)}`, position: position } }
            signalHub.outgoing.emit("event", event)

            // let event2: event = { m: EventName.agent_spawned, p: { name: `agent_${random_id(5)}`, position: position } }
            // signalHub.outgoing.emit("event", event2)
            // signalHub.incoming.emit("event", event2)

        }, 1000)

    }

    createAgent(agentName: string, position: BABYLON.Vector3) {
        const agentParams = {
            radius: 0.5,
            height: 1.8,
            maxAcceleration: 3.0,
            maxSpeed: 1.0,
            collisionQueryRange: 0.5,
            pathOptimizationRange: 0.0,
            separationWeight: 0.5
        };
        let mesh = BABYLON.MeshBuilder.CreateBox(`mesh_${agentName}`, { width: 1, depth: 1, height: 2 }, this.scene)
        BABYLON.Tags.AddTagsTo(mesh, "targetable")
        const transform = new BABYLON.TransformNode(agentName);
        mesh.parent = transform
        const agentIndex = this.crowd.addAgent(position, agentParams, transform)
        mesh.metadata ||= {}
        mesh.metadata['agentIndex'] = agentIndex // used by bullet system to check if target was an agent
        mesh.metadata['agentName'] = agentName
        this.agents[agentName] = { mesh, transform, agentIndex }

    }

    deleteAgent(agentName: string) {
        const agent = this.agents[agentName]
        this.crowd.removeAgent(agent.agentIndex)
        agent.mesh.dispose()
        agent.transform.dispose()
        delete this.agents[agentName]
    }

}