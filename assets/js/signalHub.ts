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
  animate_rotation: {
    target: string | BABYLON.TransformNode;
    from: number[] | BABYLON.Quaternion;
    to: number[] | BABYLON.Quaternion;
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
  system_started: boolean;
  space_channel_connected: { agora_app_id: string };
  camera_ready: { pos: number[]; rot: number[] };
  controller_ready: { hand: string; grip: BABYLON.AbstractMesh };
  controller_removed: { hand: string };
  //   xr_component_changed: xrComponentChange
  xr_state_changed: BABYLON.WebXRState;
  new_log: any;
  mesh_built: { name: string }; // required for transform system to reprocess when mesh is ready
  member_states_changed: { [member_id: string]: types.member_state };
  pulse: { hand: "left" | "right"; intensity: number; duration: number };
  my_state: types.member_state;
  agent_damaged: { agent_name: string };
  pointer_info: BABYLON.PointerInfo;
  mesh_picked: BABYLON.AbstractMesh;
  color_picked: BABYLON.Color3;
  keyboard_info: BABYLON.KeyboardInfo;
  trigger_substitute: any;
  collect_substitute: { entity_id: string };
  trigger_squeezed_with_entity: {
    entity_id: string;
    pos: number[];
    direction: number[];
  };
  menu_event: "logger_opened" | "logger_closed";
};

export type IncomingEvents = {
  event: types.event; // deprecate this
  entity_created: { id: string; components: ComponentObj };
  entities_deleted: { ids: string[] };
  components_upserted: { id: string; components: ComponentObj };
  components_removed: { id: string; names: string[] };
  msg: { system: string; data: any };
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
};

export type OutgoingEvents = {
  event: types.event; //deprecate this
  entity_created: { id: string; components: ComponentObj };
  entities_deleted: { ids: string[] };
  components_upserted: { id: string; components: ComponentObj };
  components_removed: { id: string; names: string[] };
  msg: { system: string; data: any };
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

export type xrComponentChange = {
  inputSource: BABYLON.WebXRInputSource;
  controllerComponent: BABYLON.WebXRControllerComponent;
};

export type MovementEvents = {
  // continuous values
  camera_moved: types.PosRot;
  left_hand_moved: types.PosRotWithVelocities;
  left_trigger: xrComponentChange;
  left_squeeze: xrComponentChange;
  left_button: xrComponentChange;
  left_thumbstick: xrComponentChange;
  left_touchpad: xrComponentChange;
  right_hand_moved: types.PosRotWithVelocities;
  right_trigger: xrComponentChange;
  right_squeeze: xrComponentChange;
  right_button: xrComponentChange;
  right_thumbstick: xrComponentChange;
  right_touchpad: xrComponentChange;
  left_axes: { x: number; y: number };
  right_axes: { x: number; y: number };

  // clean grip and release (alternating values)
  left_grip_squeezed: BABYLON.WebXRInputSource;
  left_grip_released: BABYLON.WebXRInputSource;
  left_trigger_squeezed: BABYLON.WebXRInputSource;
  left_trigger_released: BABYLON.WebXRInputSource;
  right_grip_squeezed: BABYLON.WebXRInputSource;
  right_grip_released: BABYLON.WebXRInputSource;
  right_trigger_squeezed: BABYLON.WebXRInputSource;
  right_trigger_released: BABYLON.WebXRInputSource;

  left_button_down: string; // id of button
  left_button_up: string;
  right_button_down: string;
  right_button_up: string;

  left_grip_mesh: {
    mesh: BABYLON.AbstractMesh;
  };
  left_lost_mesh: {
    reason: string;
    mesh: BABYLON.AbstractMesh;
  };
  right_grip_mesh: {
    mesh: BABYLON.AbstractMesh;
  };
  right_lost_mesh: {
    reason: string;
    mesh: BABYLON.AbstractMesh;
  };

  trigger_holding_mesh: {
    hand: "left" | "right";
    mesh: BABYLON.AbstractMesh;
  };
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
//   "signal hub initialized and assigned to window",
//   window["signalHub"]
// );
