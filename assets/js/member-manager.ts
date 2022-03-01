import type { Channel } from "phoenix";
import { BehaviorSubject, Observable } from "rxjs";
import { take } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";
import type { MemberState, PresenceDiff, PresenceState } from "./types";

export class MemberManager {
    public presentSet: Set<string>
    public memberStates: { [memberId: string]: MemberState }
    // subscribable version of memberStates
    public memberState$: BehaviorSubject<{ [memberId: string]: MemberState }>
    public channel: Channel
    public presenceState$: Observable<PresenceState>
    public presenceDiff$: Observable<PresenceDiff>

    constructor(public orchestrator: Orchestrator) {
        this.presentSet = new Set()
        this.memberStates = { [this.orchestrator.memberId]: this.myInitialState() }
        this.memberState$ = new BehaviorSubject(this.memberStates)
        this.channel = this.orchestrator.spaceBroker.spaceChannel
        this.listenToMemberUpdates()

    }

    myInitialState(): MemberState {
        return {
            micPref: "off",
            videoPref: "off",
            audioActual: "unpublished",
            videoActual: "unpublished",
            handraised: false,
            nickname: this.orchestrator.memberId
        }
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

        this.presenceState$.subscribe(msg => {
            Object.keys(msg).forEach(memberId => {
                this.presentSet.add(memberId)
            })
        })

        this.presenceDiff$.subscribe(msg => {
            Object.keys(msg.joins).forEach(memberId => {
                this.presentSet.add(memberId)
            })
            Object.keys(msg.leaves).forEach(memberId => {
                this.presentSet.delete(memberId)
            })
        })

        signalHub.on('mic').subscribe(value => {
            this.updateSelf('micPref', value)
            this.memberState$.next(this.memberStates)
        })



    }

    updateSelf(key, value) {
        this.memberStates[this.orchestrator.memberId][key] = value
        console.log(this.memberStates)
    }

}