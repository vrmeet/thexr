import * as BABYLON from "babylonjs"
import { filter, Subject } from "rxjs"
import { EventName } from "../event-names"
import { signalHub } from "../signalHub"
import type { event, member_state } from "../types"
import { random_id, arrayReduceSigFigs, reduceSigFigs } from "../utils"
import { Agent } from "./agent"
import { v4 as uuidv4 } from "uuid";
import { mode } from "../mode"
import { member_states } from "../member-states"


export class AgentManager {
    public agents: { [name: string]: Agent }
    public waveNumber: number;
    public waveAgentPool: number;
    public state: "spawning" | "waiting_for_wave_end" | "wave_ended" | "no-op"
    public preemptiveCount: number

    constructor(public member_id: string, public scene: BABYLON.Scene) {
        this.agents = {}
        this.waveNumber = 0
        this.state = "wave_ended"
        this.preemptiveCount = 0

        // subscribe to agentSpawnerCreated event and create agent spawner

        this.subscribeToAgentCreatedEvent()
        this.subscribeToAgentHitEvent()
        this.createExistingAgents()

        setInterval(() => {
            this.update()
        }, 1000)

    }

    maxAgentPoolSize() {
        return member_states.membersCount() * this.getAllEnemySpawnPoints().length * this.waveNumber
    }

    subscribeToAgentHitEvent() {

        signalHub.incoming.on("event").pipe(
            filter(evt => evt.m === EventName.agent_hit),

        ).subscribe(evt => {
            this.removeAgent(evt.p["name"])
        })

    }

    createExistingAgents() {
        signalHub.incoming.on("about_space").subscribe(event => {
            Object.entries(event.agents).forEach(([agentName, agent]) => {
                // this.addAgent("id", agent.)

                let newAgent = this.addAgent(agentName, agent.position)
                if (agent.next_position) {
                    // if this agent was moved it will have a next position
                    //newAgent.goTo(BABYLON.Vector3.FromArray(agent.next_position))
                    newAgent.teleportTo(BABYLON.Vector3.FromArray(agent.next_position))
                }
            })
        })
    }

    getAllEnemySpawnPoints() {
        return this.scene.getMeshesByTags("enemy_spawner")
    }

    agentsCount() {
        return Object.keys(this.agents).length + this.preemptiveCount
    }


    update() {
        if (mode.leader) {
            if (this.state === "spawning") {
                if (this.agentsCount() < this.maxAgentPoolSize()) {
                    // modify this logic to have a 'break', rest between waves
                    let enemySpawnPoints = this.getAllEnemySpawnPoints()
                    enemySpawnPoints.forEach(enemySpawnPoint => {
                        // use some logic to figure out when to create new agents from existing spawn points
                        this.createAgentEvent(enemySpawnPoint.position)
                    })
                } else {
                    this.state = "waiting_for_wave_end"
                }
            } else if (this.state === "waiting_for_wave_end") {
                if (this.agentsCount() === 0) {
                    this.state = "wave_ended"
                }
            } else if (this.state === "wave_ended") {
                // this state only runs for one cycle, and queues up a new wave
                this.state = "no-op"
                setTimeout(() => {
                    this.beginNewWave()
                }, 5000)
            }

        }
    }

    beginNewWave() {
        this.waveNumber++
        signalHub.local.emit("hud_msg", `Starting Wave ${this.waveNumber}`)
        this.state = "spawning"
    }

    subscribeToAgentCreatedEvent() {
        signalHub.incoming.on("event").pipe(
            filter(evt => evt.m === EventName.agent_spawned)
        ).subscribe((evt: any) => {
            this.addAgent(evt.p.name, evt.p.position)
        })
    }

    removeAgent(name: string) {
        let agent = this.agents[name]
        if (agent) {
            agent.dispose()
        }
        delete this.agents[name]
    }



    addAgent(name: string, position: number[]) {
        this.preemptiveCount--
        let agent = new Agent(name, position, this.scene)
        this.agents[name] = agent
        return agent
    }

    getRandomEnemySpawnPoint() {
        const list = this.getAllEnemySpawnPoints()
        if (list.length > 0) {
            return list[Math.floor(Math.random() * list.length)]
        } else {
            return null
        }
    }

    getRandomAgent() {
        const agentNames = Object.keys(this.agents)
        if (agentNames.length > 0) {
            const randomAgentName = agentNames[Math.floor(Math.random() * agentNames.length)]
            return this.agents[randomAgentName]
        } else {
            return null
        }
    }

    createAgentEvent(position: BABYLON.Vector3) {
        this.preemptiveCount++
        let evt: event = { m: EventName.agent_spawned, p: { name: `agent_${random_id(5)}`, position: position.asArray() } }
        signalHub.outgoing.emit("event", evt)

    }

}