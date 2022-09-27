/**
 * The context is a way of sharing commonly used data globally from any module that imports it
 */
import * as BABYLON from "babylonjs";
type BABYLON = typeof BABYLON;

import * as MAT from "babylonjs-materials";
type MAT = typeof MAT;

import * as RXJS from "rxjs";
type RXJS = typeof RXJS;

import { Emitter } from "typed-rx-emitter";
import type { ComponentObj } from "./ecs/components/component-obj";
import type {
  SignalHub,
  LocalEvents,
  IncomingEvents,
  MenuEvents,
  MovementEvents,
  OutgoingEvents,
  ServiceRequests,
} from "./signalHub";

export interface ISynergizer {
  initEntity(entity_id: string, components: ComponentObj): void;
}

export interface State {
  [entityId: string]: ComponentObj;
}

export interface Context {
  my_member_id: string;
  space_id: string;
  webrtc_channel_id: string;
  userToken: string;
  scene: BABYLON.Scene;
  synergizer: ISynergizer;
  signalHub: SignalHub;
  state: State;
  BABYLON: BABYLON;
  MAT: MAT;
  RXJS: RXJS;
}

export const createContext = (): Context => {
  return {
    my_member_id: null,
    space_id: null,
    webrtc_channel_id: null,
    userToken: null,
    scene: null,
    synergizer: null,
    signalHub: {
      local: new Emitter<LocalEvents>(),
      incoming: new Emitter<IncomingEvents>(),
      outgoing: new Emitter<OutgoingEvents>(),
      menu: new Emitter<MenuEvents>(),
      movement: new Emitter<MovementEvents>(),
      service: new Emitter<ServiceRequests>(),
    },
    state: {},
    BABYLON: BABYLON,
    MAT: MAT,
    RXJS: RXJS,
  };
};
