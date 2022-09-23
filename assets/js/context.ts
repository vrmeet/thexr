/**
 * The context is a way of sharing commonly used data globally from any module that imports it
 */
import * as BABYLON from "babylonjs";
type BABYLON = typeof BABYLON;
import * as MAT from "babylonjs-materials";
type MAT = typeof MAT;
import { Emitter } from "typed-rx-emitter";
import type { ComponentObj } from "./ecs/components/component-obj";
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
  initEntity(entity_id: string, components: ComponentObj): void;
}

export interface State {
  [entityId: string]: ComponentObj;
}

export interface Context {
  my_member_id: string;
  scene: BABYLON.Scene;
  synergizer: ISynergizer;
  signalHub: SignalHub;
  state: State;
  BABYLON: BABYLON;
  MAT: MAT;
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
    state: {},
    BABYLON: BABYLON,
    MAT: MAT,
  };
};
