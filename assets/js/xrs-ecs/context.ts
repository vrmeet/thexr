/**
 * The context is a way of sharing commonly used data globally from any module that imports it
 */

import * as sessionPersistance from "../sessionPersistance";

import * as BABYLON from "babylonjs";
type BABYLON = typeof BABYLON;

import * as MAT from "babylonjs-materials";
type MAT = typeof MAT;

import * as RXJS from "rxjs";
type RXJS = typeof RXJS;

import { Emitter } from "typed-rx-emitter";
import type {
  SignalHub,
  LocalEvents,
  IncomingEvents,
  MenuEvents,
  MovementEvents,
  OutgoingEvents,
  ServiceRequests,
} from "../signalHub";
import type { Channel } from "phoenix";
import type { ISystem } from "./isystem";
import type { Entity } from "./entity";

export interface Context {
  systems: Record<string, ISystem>;
  entities: Record<string, Entity>;
  my_member_id: string;
  my_nickname: string;
  my_mic_muted: boolean;
  bypass_modal: boolean;
  menu_opened: boolean;
  logs_opened: boolean;
  space: { id: string; name: string; state_id: string };
  webrtc_channel_id: string;
  userToken: string;
  scene: BABYLON.Scene;
  engine: BABYLON.Engine;
  channel: Channel;
  signalHub: SignalHub;
  BABYLON: BABYLON;
  MAT: MAT;
  RXJS: RXJS;
}

export type OPTS = {
  my_member_id: string;
  space: { id: string; name: string; state_id: string };
  webrtc_channel_id: string;
  userToken: string;
  engine: BABYLON.Engine;
};

export const createContext = (opts: OPTS): Context => {
  const defaults = {
    systems: {},
    entities: {},
    my_member_id: null,
    my_nickname: null,
    my_mic_muted: true,
    bypass_modal: false,
    menu_opened: false,
    logs_opened: false,
    space: null,
    webrtc_channel_id: null,
    userToken: null,
    scene: null,
    engine: null,
    channel: null,
    signalHub: {
      local: new Emitter<LocalEvents>(),
      incoming: new Emitter<IncomingEvents>(),
      outgoing: new Emitter<OutgoingEvents>(),
      menu: new Emitter<MenuEvents>(),
      movement: new Emitter<MovementEvents>(),
      service: new Emitter<ServiceRequests>(),
    },
    BABYLON: BABYLON,
    MAT: MAT,
    RXJS: RXJS,
  };
  defaults.engine = opts.engine;
  defaults.my_member_id = opts.my_member_id;
  defaults.my_nickname =
    sessionPersistance.getNickname()?.nickname || opts.my_member_id;
  defaults.my_mic_muted = true;
  defaults.space = opts.space;
  defaults.webrtc_channel_id = opts.webrtc_channel_id;
  defaults.userToken = opts.userToken;
  return defaults;
};
