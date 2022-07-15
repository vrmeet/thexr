import * as BABYLON from "babylonjs"
import { filter } from "rxjs"
import { EventName } from "../event-names"
import { signalHub } from "../signalHub"
import type { event, member_state } from "../types"
import { random_id, arrayReduceSigFigs, reduceSigFigs } from "../utils"

export class AgentManager {
    public agentSpawnPoints: { [name: string]: any }
    public memberStates: { [member_id: string]: member_state }
    public agents: { [name: string]: { agentIndex: number, mesh: BABYLON.AbstractMesh, visiblityCone: BABYLON.AbstractMesh, transform: BABYLON.TransformNode, moving: boolean } }
    constructor(public member_id: string, public plugin: BABYLON.RecastJSPlugin, public crowd: BABYLON.ICrowd, public scene: BABYLON.Scene) {
        this.agentSpawnPoints = {}
        this.agents = {}
        this.memberStates = {}

        signalHub.local.on("member_states_changed").subscribe(event => {
            this.memberStates = event
        })

        // creates any previously spawned agents
        signalHub.incoming.on("about_agents").subscribe((payload) => {

            Object.entries(payload.agents).forEach(([agentName, agent]) => {
                this.createAgent(agentName, BABYLON.Vector3.FromArray(agent.prev_position))
                this.crowd.agentGoto(this.agents[agentName].agentIndex, BABYLON.Vector3.FromArray(agent.next_position))
            })
        })

        // creates newly spawned agents
        signalHub.incoming.on("event").pipe(
            filter(event => event.m === EventName.agent_spawned)
        ).subscribe(event => {
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
                            this.agents[agent.name].moving = true
                            const agentIndex = this.agents[agent.name].agentIndex
                            const dest = BABYLON.Vector3.FromArray(agent.next_position)
                            this.crowd.agentGoto(agentIndex, dest)
                        }
                    }, agent.delay)
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

        this.crowd['onReachTargetObservable'].add((agentInfos) => {
            const agentIndex = agentInfos.agentIndex
            const [agentName, agent] = Object.entries(this.agents).filter(([agentName, agent]) => (agent.agentIndex === agentIndex))[0]
            this.agents[agentName].moving = false

            const proximity = BABYLON.Vector3.Distance(agent.transform.position, this.scene.activeCamera.position)
            if (proximity < 2) {
                signalHub.outgoing.emit("event", { m: EventName.member_damaged, p: { member_id: this.member_id } })
                signalHub.incoming.emit("event", { m: EventName.member_damaged, p: { member_id: this.member_id } })
                signalHub.local.emit("pulse", { hand: "left", intensity: 0.3, duration: 120 })
                signalHub.local.emit("pulse", { hand: "right", intensity: 0.3, duration: 120 })
            }

        });

    }

    addAgentSpawnPoint(name: string) {
        this.agentSpawnPoints[name] = true
    }

    getRandomAgent() {
        const agentNames = Object.keys(this.agents)
        return agentNames[Math.floor(Math.random() * agentNames.length)]
    }

    agentSeesMe(visiblityCone: BABYLON.AbstractMesh, position: BABYLON.Vector3) {
        if (visiblityCone.intersectsPoint(position)) {
            return position
        }
        return null
    }

    seenAgent(visiblityCone: BABYLON.AbstractMesh, avatars: BABYLON.AbstractMesh[]) {
        for (let i = 0; i < avatars.length; i++) {
            if (avatars[i].intersectsMesh(visiblityCone)) {
                return avatars[i].position
            }
        }
        return this.agentSeesMe(visiblityCone, this.scene.activeCamera.position)
    }

    closestPointToSeenAgent(visiblityCone: BABYLON.AbstractMesh, avatars: BABYLON.AbstractMesh[]) {
        const result = this.seenAgent(visiblityCone, avatars)
        if (result) {
            return this.plugin.getClosestPoint(result)
        }
        return null
    }

    sendAgentMovements() {
        if (Object.keys(this.agents).length < 1) {
            return
        }
        const avatars = this.scene.getMeshesByTags("avatar")
        const futurePositions = Object.entries(this.agents)
            // .filter(([agentName, agent]) => (agent.moving === false))
            .map(([agentName, agent]) => {

                const seeAvatarAt = this.closestPointToSeenAgent(agent.visiblityCone, avatars)
                return { name: agentName, seeAvatarAt, agent }
            }).filter(({ name, seeAvatarAt, agent }) => (agent.moving === false || seeAvatarAt !== null))
            .map(({ name, seeAvatarAt, agent }) => {
                const currentPosition = agent.transform.position
                const nextPosition = (seeAvatarAt) ? seeAvatarAt : this.plugin.getRandomPointAround(currentPosition, 2)
                const delay = Math.random() * 500

                return {
                    name: name,
                    prev_position: arrayReduceSigFigs(currentPosition.asArray()),
                    next_position: arrayReduceSigFigs(nextPosition.asArray()),
                    delay: reduceSigFigs(delay),
                }
            })

        if (futurePositions.length < 1) {
            return
        }

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
        }, 500)
    }

    countAgents() {
        return Object.keys(this.agents).length
    }

    countMembers() {
        return Object.keys(this.memberStates).length
    }

    oneChanceInX(x: number) {
        return (Math.floor(Math.random() * x) + 1) % x == 0
    }

    startSpawning() {
        // called by leader
        // create an event
        setInterval(() => {
            // no-op if no spawn points
            if (Object.keys(this.agentSpawnPoints).length === 0) {
                return
            }
            if ((this.countAgents() < this.countMembers()) && this.oneChanceInX(5)) {
                const spawnerName = Object.keys(this.agentSpawnPoints)[0]
                const position = this.scene.getMeshByName(spawnerName).position.asArray()
                let event: event = { m: EventName.agent_spawned, p: { name: `agent_${random_id(5)}`, position: position } }
                signalHub.outgoing.emit("event", event)
            }

        }, 2000)


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
        let head = BABYLON.MeshBuilder.CreateCylinder(`head_${agentName}`, { diameterBottom: 0, diameterTop: 0.5, height: 0.8 }, this.scene)
        head.rotation.x = BABYLON.Angle.FromDegrees(90).radians()
        head.position.y = 1.5

        let coneOfSight = BABYLON.MeshBuilder.CreateCylinder(`head_${agentName}`, { diameterBottom: 0.2, diameterTop: 8, height: 15 }, this.scene)
        coneOfSight.rotation.x = BABYLON.Angle.FromDegrees(92).radians()
        coneOfSight.position.y = 1.3
        coneOfSight.scaling.x = 2
        coneOfSight.scaling.z = 0.5
        coneOfSight.position.z = 7
        coneOfSight.visibility = 0.5
        coneOfSight.isPickable = false

        let body = BABYLON.MeshBuilder.CreateBox(`mesh_${agentName}`, { width: 1, depth: 1, height: 2 }, this.scene)
        let mesh = BABYLON.Mesh.MergeMeshes([head, body], true);
        BABYLON.Tags.AddTagsTo(mesh, "targetable")
        const transform = new BABYLON.TransformNode(agentName);
        mesh.parent = transform
        coneOfSight.parent = mesh
        const agentIndex = this.crowd.addAgent(position, agentParams, transform)
        mesh.metadata ||= {}
        mesh.metadata['agentIndex'] = agentIndex // used by bullet system to check if target was an agent
        mesh.metadata['agentName'] = agentName
        this.agents[agentName] = { mesh, transform, agentIndex, visiblityCone: coneOfSight, moving: false }

    }

    deleteAgent(agentName: string) {
        const agent = this.agents[agentName]
        this.crowd.removeAgent(agent.agentIndex)
        agent.mesh.dispose()
        agent.transform.dispose()
        delete this.agents[agentName]
    }

}