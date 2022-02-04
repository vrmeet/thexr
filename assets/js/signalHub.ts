import { Subject } from "rxjs";
import type { SignalEvent } from "./types";

export const signalHub = new Subject<SignalEvent>();