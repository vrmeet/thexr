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
import type { ISystem } from "./system";
import type { Entity } from "./entity";
import type { ComponentObj } from "../ecs/components/component-obj";

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
  user_token: string;
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
  user_token: string;
  engine: BABYLON.Engine;
};

export const defaultContext = () => {
  return {
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
    user_token: null,
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
};
