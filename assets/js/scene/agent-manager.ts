import * as BABYLON from "babylonjs"
import { filter } from "rxjs"
import { EventName } from "../event-names"
import { signalHub } from "../signalHub"
import type { event, member_state } from "../types"
import { random_id, arrayReduceSigFigs, reduceSigFigs } from "../utils"
import { Agent } from "./agent"
import { v4 as uuidv4 } from "uuid";


export class AgentManager {
    public agentSpawnPoints: { [name: string]: BABYLON.Vector3 }
    public agents: { [name: string]: Agent }
    constructor(public member_id: string, public scene: BABYLON.Scene) {
        this.agentSpawnPoints = {}
        this.agents = {}
        this.subscribeToAgentCreatedEvent()

    }

    subscribeToAgentCreatedEvent() {
        signalHub.incoming.on("event").pipe(
            filter(evt => evt.m === EventName.agent_spawned)
        ).subscribe((evt: any) => {
            this.addAgent(evt.p.id, evt.p.name, evt.p.position)
        })
    }

    // add a location where new agents/enemies spawn out of, to fight our heros
    addAgentSpawnPoint(name: string, position: number[]) {
        this.agentSpawnPoints[name] = BABYLON.Vector3.FromArray(position)
    }

    addAgent(id: string, name: string, position: number[]) {
        this.agents[name] = new Agent(id, name, position, this.scene)
    }

    getRandomAgent() {
        const agentNames = Object.keys(this.agents)
        return agentNames[Math.floor(Math.random() * agentNames.length)]
    }

    createAgentEvent() {

        let evt: event = { m: EventName.agent_spawned, p: { id: uuidv4(), name: `agent_${random_id(5)}`, position: [0, 0, 0] } }
        signalHub.outgoing.emit("event", evt)

    }

}