import type { ComponentObj } from "./ecs/components/component-obj";
import type { EventName } from "./event-names";

export type scene_settings = {
  use_skybox: boolean;
  skybox_inclination: number;
  clear_color: string;
  fog_color: string;
  fog_density: number;
};

export type serialized_space = {
  settings: scene_settings;
  id: string;
  entities: any[];
};

export type xr_component = {
  pressed: boolean;
  touched: boolean;
  value: number;
  axes: { x: number; y: number };
  id: string;
};

export interface member_state {
  mic_muted?: boolean;
  nickname?: string;
  health: number;
  status: "active" | "inactive";
}

export type PosRotWithVelocities = {
  pos: number[];
  rot: number[];
  lv: number[];
  av: number[];
};

export type PosRot = {
  pos: number[];
  rot: number[];
};

export type PresenceState = {
  [member_id: string]: { metas: any };
};

export type PresenceDiff = {
  joins: PresenceState;
  leaves: PresenceState;
};

export type EditMode = "transform" | "delete" | "dup" | null;

export type Component =
  | { type: "position"; data: { value: number[] } }
  | { type: "rotation"; data: { value: number[] } }
  | { type: "scaling"; data: { value: number[] } }
  | { type: "color"; data: { value: string } }
  | { type: "height"; data: { value: number } }
  | { type: "width"; data: { value: number } }
  | { type: "depth"; data: { value: number } }
  | { type: "points"; data: { value: number[] } }
  | { type: string; data: { value: any } };

/**
 * new events
 */

export interface IEvent {
  m: number;
  p: any;
  ts?: number;
}

export interface IEntityCreatedEvent extends IEvent {
  m: EventName.entity_created2;
  p: { entity_id: string; components: ComponentObj };
}

export interface IMemberEnteredEvent extends IEvent {
  m: EventName.member_entered;
  p: {
    member_id: string;
    pos_rot: PosRot;
    left?: PosRot;
    right?: PosRot;
    state: member_state;
  };
}

export interface IMemberMovedEvent extends IEvent {
  m: EventName.member_moved;
  p: { member_id: string; pos_rot: PosRot; left?: PosRot; right?: PosRot };
}

export type Event = IEntityCreatedEvent | IMemberMovedEvent;

/** classic events */

export type event =
  | {
      m: EventName.member_changed_mic_pref;
      p: { member_id: string; mic_muted: boolean };
      ts?: number;
    }
  | {
      m: EventName.member_changed_nickname;
      p: { member_id: string; nickname: string };
      ts?: number;
    }
  | {
      m: EventName.member_entered;
      p: { member_id: string; pos_rot: PosRot; state: member_state };
      ts?: number;
    }
  | { m: EventName.member_observed; p: { member_id: string }; ts?: number }
  | {
      m: EventName.member_moved;
      p: { member_id: string; pos_rot: PosRot; left?: PosRot; right?: PosRot };
      ts?: number;
    }
  | { m: EventName.member_left; p: { member_id: string }; ts?: number }
  | { m: EventName.member_died; p: { member_id: string } }
  | { m: EventName.member_respawned; p: { member_id: string; pos_rot: PosRot } }
  | {
      m: EventName.entity_created;
      p: { type: string; id: string; name: string; components: Component[] };
      ts?: number;
    }
  | {
      m: EventName.entity_created2;
      p: { entity_id: string; components: ComponentObj };
      ts?: number;
    }
  | {
      m: EventName.entity_transformed;
      p: { id: string; components: Component[] };
      ts?: number;
    }
  | {
      m: EventName.entity_animated_to;
      p: {
        entity_id: string;
        pos?: number[];
        rot?: number[];
        duration: number;
      };
      ts?: number;
    }
  | {
      m: EventName.entity_colored;
      p: { id: string; color: string };
      ts?: number;
    }
  | { m: EventName.entity_deleted; p: { id: string }; ts?: number }
  | {
      m: EventName.entity_grabbed;
      p: {
        member_id: string;
        entity_id: string;
        hand: string;
        hand_pos_rot: PosRot;
        entity_pos_rot: PosRot;
      };
    }
  | {
      m: EventName.entity_released;
      p: {
        member_id: string;
        entity_id: string;
        hand: string;
        hand_pos_rot: PosRot;
        entity_pos_rot: PosRot;
        lv?: number[];
        av?: number[];
      };
    }
  | {
      m: EventName.entity_trigger_squeezed;
      p: {
        member_id: string;
        entity_id: string;
        pos: number[];
        direction: number[];
      };
    }
  | {
      m: EventName.entity_collected;
      p: { member_id: string; entity_id: string };
    }
  | { m: EventName.member_damaged; p: { member_id: string } }
  | {
      m: EventName.hud_message_broadcasted;
      p: { member_id: string; msg: string };
    }
  | { m: EventName.agent_spawned; p: { name: string; position: number[] } }
  | {
      m: EventName.agent_directed;
      p: { name: string; position: number[]; next_position: number[] };
    }
  | { m: EventName.agent_stopped; p: { name: string; position: number[] } }
  | {
      m: EventName.agent_attacked_member;
      p: { name: string; member_id: string };
    }
  | {
      m: EventName.agent_hit;
      p: { name: string; pos: number[]; direction: number[] };
    }
  | {
      m: EventName.target_hit;
      p: { entity_id: string; pos: number[]; direction: number[] };
    };

// { m: EventName.agent_path_planned, p: { agent_id: string, pos_rot: PosRot } } |
// { m: EventName.agent_removed, p: { agent_id: string } }
// ["member_left", { member_id: string }] |
// ["member_moved", { member_id: string, pos_rot: PosRot }]
