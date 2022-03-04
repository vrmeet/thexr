import type { Channel } from "phoenix";
import { Subject, Observable } from "rxjs";
import { take } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";
import type { MemberState, PresenceDiff, PresenceState } from "./types";

export class MemberManager {
    public presentSet: Set<string>
    // subscribable version of memberStates
    public memberState: { [memberId: string]: MemberState }
    public memberStatesUpdated: Subject<any>
    public channel: Channel
    public presenceState$: Observable<PresenceState>
    public presenceDiff$: Observable<PresenceDiff>

    constructor(public orchestrator: Orchestrator) {
        this.presentSet = new Set()
        this.memberStatesUpdated = new Subject()
        this.memberState = {}
        this.channel = this.orchestrator.spaceBroker.spaceChannel
        this.listenToMemberUpdates()

    }



    listenToMemberUpdates() {

        this.presenceState$ = new Observable<PresenceState>(subscriber => {
            // wrap the channel observable
            const ref =
                this.channel.on('presence_state', (state) => {
                    subscriber.next(state)
                })

            return () => {
                this.channel.off('presence_state', ref)
            }
        })

        this.presenceDiff$ = new Observable<PresenceDiff>(subscriber => {
            // wrap the channel observable
            const ref =
                this.channel.on('presence_diff', (state) => {
                    subscriber.next(state)
                })

            return () => {
                this.channel.off('presence_diff', ref)
            }
        })

        this.presenceState$.subscribe((states: PresenceState) => {

            Object.keys(states).forEach(memberId => {
                this.presentSet.add(memberId)
                this.memberState[memberId] = states[memberId].metas[0].state
            })
        })

        this.presenceDiff$.subscribe(msg => {
            Object.keys(msg.joins).forEach(memberId => {
                this.presentSet.add(memberId)
                this.memberState[memberId] = msg.joins[memberId].metas[0].state
                this.memberStatesUpdated.next(null)
            })
            Object.keys(msg.leaves).forEach(memberId => {
                this.presentSet.delete(memberId)
                delete this.memberState[memberId]
                this.memberStatesUpdated.next(null)
            })
        })

        this.channel.on("member_state_updated", (payload) => {
            this.memberState[payload.member_id] = payload['new_state']
            this.memberStatesUpdated.next(null)
        })

        signalHub.on('mic').subscribe(value => {
            this.updateMember(this.orchestrator.memberId, 'micPref', value)
            this.memberStatesUpdated.next(null)
        })

    }

    updateMember(memberId, key, value) {
        this.memberState[memberId][key] = value
        if (memberId == this.orchestrator.memberId) {
            this.channel.push('member_state_changed', this.memberState[memberId])
        }
    }

}