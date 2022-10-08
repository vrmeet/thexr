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
import type { ISystem } from "./ecs/builtin_systems/isystem";
import type {
  SignalHub,
  LocalEvents,
  IncomingEvents,
  MenuEvents,
  MovementEvents,
  OutgoingEvents,
  ServiceRequests,
} from "./signalHub";

export interface State {
  [entityId: string]: ComponentObj;
}

export interface Context {
  my_member_id: string;
  my_nickname: string;
  my_mic_muted: boolean;
  bypass_modal: boolean;
  menu_opened: boolean;
  logs_opened: boolean;
  space_id: string;
  webrtc_channel_id: string;
  userToken: string;
  scene: BABYLON.Scene;
  signalHub: SignalHub;
  systems: Record<string, ISystem>;
  state: State;
  BABYLON: BABYLON;
  MAT: MAT;
  RXJS: RXJS;
}

export const createContext = (): Context => {
  return {
    my_member_id: null,
    my_nickname: null,
    my_mic_muted: true,
    bypass_modal: false,
    menu_opened: false,
    logs_opened: false,
    space_id: null,
    webrtc_channel_id: null,
    userToken: null,
    scene: null,
    signalHub: {
      local: new Emitter<LocalEvents>(),
      incoming: new Emitter<IncomingEvents>(),
      outgoing: new Emitter<OutgoingEvents>(),
      menu: new Emitter<MenuEvents>(),
      movement: new Emitter<MovementEvents>(),
      service: new Emitter<ServiceRequests>(),
    },
    systems: {},
    state: {},
    BABYLON: BABYLON,
    MAT: MAT,
    RXJS: RXJS,
  };
};
