import { BehaviorSubject } from "rxjs";

export const store = new BehaviorSubject<any>({ hello: "world" })