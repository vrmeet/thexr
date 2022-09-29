import type { Emitter } from "typed-rx-emitter";
import type * as types from "./types";
import type * as BABYLON from "babylonjs";
import type { ComponentObj } from "./ecs/components/component-obj";

export type ServiceRequests = {
  animate_translate: {
    target: string | BABYLON.TransformNode;
    from: number[] | BABYLON.Vector3;
    to: number[] | BABYLON.Vector3;
    duration: number;
    callback?: () => void;
  };
  position_in_front: {
    subject: BABYLON.TransformNode;
    height: "eye_line" | "floor";
  };
};

export type LocalEvents = {
  client_ready: "enter" | "observe";
  space_channel_connected: { agora_app_id: string };
  camera_ready: { pos: number[]; rot: number[] };
  controller_ready: { hand: string };
  //   xr_component_changed: types.xr_component
  xr_state_changed: BABYLON.WebXRState;
  new_log: any;
  mesh_built: { name: string; type: string }; // required to add new meshes to teleport manager
  member_states_changed: { [member_id: string]: types.member_state };
  pulse: { hand: "left" | "right"; intensity: number; duration: number };
  my_state: types.member_state;
  agent_damaged: { agent_name: string };
  pointer_info: BABYLON.PointerInfo;
  mesh_picked: BABYLON.AbstractMesh;
  keyboard_info: BABYLON.KeyboardInfo;
  trigger_substitute: any;
  collect_substitute: { entity_id: string };
  trigger_squeezed_with_entity: {
    entity_id: string;
    pos: number[];
    direction: number[];
  };
};

export type IncomingEvents = {
  event: types.event; // deprecate this
  entity_created: { id: string; components: ComponentObj };
  entities_deleted: { ids: string[] };
  components_upserted: { id: string; components: ComponentObj };
  components_removed: { id: string; names: string[] };
  custom_msg: any;
  hud_broadcast: { message: string };
  presence_diff: types.PresenceDiff;
  presence_state: types.PresenceState;
  space_settings_changed: types.scene_settings;
  space_state: { [entity_id: string]: ComponentObj };
  server_lost: any;
  new_leader: { member_id: string };
  about_members: {
    movements: { [member_id: string]: { pos_rot: types.PosRot } };
    states: { [member_id: string]: types.member_state };
  };
  about_agents: {
    agents: {
      [name: string]: {
        position: number[];
        next_position: number[];
        delay: number;
      };
    };
  };
  about_space: {
    agents: { [name: string]: { position: number[]; next_position: number[] } };
    entities: { [entity_id: string]: types.event };
  };
  hud_msg: { msg: string } | string;
};

export type OutgoingEvents = {
  event: types.event; //deprecate this
  entity_created: { id: string; components: ComponentObj };
  entities_deleted: { ids: string };
  components_upserted: { id: string; components: ComponentObj };
  components_removed: { id: string; names: string[] };
  custom_msg: any;
  hud_broadcast: { msg: string };
};

export type MenuEvents = {
  menu_opened: boolean;
  menu_topic: string;
  menu_editing_tool: types.EditMode;
  toggle_mic: any;
  update_nickname: string;
};

// export type HandPosRot = {
//     hand: string, pos: number[], rot: number[]
// }

export type MovementEvents = {
  // continuous values
  camera_moved: types.PosRot;
  left_hand_moved: types.PosRot;
  left_trigger: types.xr_component;
  left_squeeze: types.xr_component;
  left_button: types.xr_component;
  left_thumbstick: types.xr_component;
  left_touchpad: types.xr_component;
  right_hand_moved: types.PosRot;
  right_trigger: types.xr_component;
  right_squeeze: types.xr_component;
  right_button: types.xr_component;
  right_thumbstick: types.xr_component;
  right_touchpad: types.xr_component;

  // clean grip and release (alternating values)
  left_grip_squeezed: any;
  left_grip_released: any;
  left_trigger_squeezed: any;
  left_trigger_released: any;
  right_grip_squeezed: any;
  right_grip_released: any;
  right_trigger_squeezed: any;
  right_trigger_released: any;
  left_grip_mesh: BABYLON.AbstractMesh;
  right_grip_mesh: BABYLON.AbstractMesh;

  // ... with a mesh
  // left_grip_squeezed_w_mesh: BABYLON.AbstractMesh
  // left_grip_released_w_mesh: BABYLON.AbstractMesh
  // right_grip_squeezed_w_mesh: BABYLON.AbstractMesh
  // right_grip_released_w_mesh: BABYLON.AbstractMesh

  // left_grab_start: { entity_id: string }
  // left_grab_released: { entity_id: string }
  // left_grab_end: { entity_id: string }
  // right_grab_start: { entity_id: string }
  // right_grab_released: { entity_id: string }
  // right_grab_end: { entity_id: string }
};

export interface SignalHub {
  local: Emitter<LocalEvents>;
  incoming: Emitter<IncomingEvents>;
  outgoing: Emitter<OutgoingEvents>;
  menu: Emitter<MenuEvents>;
  movement: Emitter<MovementEvents>;
  service: Emitter<ServiceRequests>;
}

// export const signalHub: SignalHub = {
//   local: new Emitter<LocalEvents>(),
//   incoming: new Emitter<IncomingEvents>(),
//   outgoing: new Emitter<OutgoingEvents>(),
//   menu: new Emitter<MenuEvents>(),
//   movement: new Emitter<MovementEvents>(),
// };

// set signalHub message routings

// window["signalHub"] = signalHub;
// console.log(
//   "signal hub initialized and assigned to window",
//   window["signalHub"]
// );
