import { Subject } from "rxjs";
import { filter } from 'rxjs/operators'
import type { SignalEvent } from "./types";

export const signalHub = new Subject<SignalEvent>();

export const listen = (event: string) => {
    return signalHub.pipe(
        filter(msg => (msg.event === event))
    )
}