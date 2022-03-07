import type { Channel } from "phoenix";
import { Subject, Observable } from "rxjs";
import { take } from "rxjs/operators";
import type { Orchestrator } from "./orchestrator";
import { signalHub } from "./signalHub";
import type { member_state, PresenceDiff, PresenceState } from "./types";

// export class MemberManager {
//     public presentSet: Set<string>
//     // subscribable version of memberStates
//     public memberState: { [member_id: string]: member_state }
//     public memberStatesUpdated: Subject<any>
//     public channel: Channel
//     public presenceState$: Observable<PresenceState>
//     public presenceDiff$: Observable<PresenceDiff>

//     constructor(public orchestrator: Orchestrator) {
//         this.presentSet = new Set()
//         this.memberStatesUpdated = new Subject()
//         this.memberState = {}
//         this.channel = this.orchestrator.spaceBroker.spaceChannel
//         this.listenToMemberUpdates()

//     }



//     listenToMemberUpdates() {

//         this.presenceState$ = new Observable<PresenceState>(subscriber => {
//             // wrap the channel observable
//             const ref =
//                 this.channel.on('presence_state', (state) => {
//                     subscriber.next(state)
//                 })

//             return () => {
//                 this.channel.off('presence_state', ref)
//             }
//         })

//         this.presenceDiff$ = new Observable<PresenceDiff>(subscriber => {
//             // wrap the channel observable
//             const ref =
//                 this.channel.on('presence_diff', (state) => {
//                     subscriber.next(state)
//                 })

//             return () => {
//                 this.channel.off('presence_diff', ref)
//             }
//         })

//         this.presenceState$.subscribe((states: PresenceState) => {
//             Object.keys(states).forEach(member_id => {
//                 this.presentSet.add(member_id)
//             })
//         })

//         this.presenceDiff$.subscribe(msg => {
//             Object.keys(msg.joins).forEach(member_id => {
//                 this.presentSet.add(member_id)
//             })
//             Object.keys(msg.leaves).forEach(member_id => {
//                 this.deleteMember(member_id)
//             })
//         })

//         this.channel.on('new_member', ({ member_id, pos_rot, state }) => {
//             this.updateMember(member_id, state)
//         })

//         this.channel.on('members', ({ states }) => {
//             this.memberState = { ...this.memberState, ...states }
//             this.memberStatesUpdated.next(null)
//         })

//         this.channel.on("member_state_updated", (payload) => {
//             this.updateMember(payload.member_id, payload['new_state'])
//         })

//         signalHub.on('mic').subscribe(value => {
//             this.patchMember(this.orchestrator.member_id, 'mic_pref', value)
//         })

//     }

//     deleteMember(member_id) {
//         this.presentSet.delete(member_id)
//         delete this.memberState[member_id]
//         this.memberStatesUpdated.next(null)
//     }

//     updateMember(member_id, new_state) {
//         this.memberState[member_id] = new_state
//         this.memberStatesUpdated.next(null)
//     }

//     patchMember(member_id, key, value) {
//         this.memberState[member_id][key] = value
//         this.memberState[member_id]['updated_at'] = Date.now()
//         if (member_id == this.orchestrator.member_id) {
//             this.channel.push('member_state_changed', this.memberState[member_id])
//         }
//         this.memberStatesUpdated.next(null)
//     }

// }