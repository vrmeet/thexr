/**
 * The context is a way of sharing commonly used data globally from any module that imports it
 */
import type * as BABYLON from "babylonjs";
import { Emitter } from "typed-rx-emitter";
import type { Entity } from "./ecs/entities/entity";
import type {
  SignalHub,
  LocalEvents,
  IncomingEvents,
  MenuEvents,
  MovementEvents,
  OutgoingEvents,
} from "./signalHub";

export interface ISynergizer {
  initEntity(entity: Entity): void;
}

export interface Context {
  my_member_id: string;
  scene: BABYLON.Scene;
  synergizer: ISynergizer;
  signalHub: SignalHub;
}

export const createContext = (): Context => {
  return {
    my_member_id: null,
    scene: null,
    synergizer: null,
    signalHub: {
      local: new Emitter<LocalEvents>(),
      incoming: new Emitter<IncomingEvents>(),
      outgoing: new Emitter<OutgoingEvents>(),
      menu: new Emitter<MenuEvents>(),
      movement: new Emitter<MovementEvents>(),
    },
  };
};