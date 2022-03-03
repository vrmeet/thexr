import type { Channel } from "phoenix";
import { BehaviorSubject, Observable } from "rxjs";
import { take } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";
import type { MemberState, PresenceDiff, PresenceState } from "./types";

export class MemberManager {
    public presentSet: Set<string>
    // subscribable version of memberStates
    public memberState: { [memberId: string]: MemberState }
    public channel: Channel
    public presenceState$: Observable<PresenceState>
    public presenceDiff$: Observable<PresenceDiff>

    constructor(public orchestrator: Orchestrator) {
        this.presentSet = new Set()
        this.memberState = { [this.orchestrator.memberId]: this.myInitialState() }
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
            this.updateMember(this.orchestrator.memberId, 'micPref', value)

        })

    }

    updateMember(memberId, key, value) {
        this.memberState[memberId][key] = value
    }

}