import type { PosRot } from "../../types";
import type {
  BoxShape,
  SphereShape,
  CylinderShape,
  PlaneShape,
  CapsuleShape,
} from "./shape";

/**
 * The ComponentObj has unique keys for every possible component
 * ensuring that an entity cannot have two components of the same kind
 *
 * Every component key is optional.  Components are just data to be interpreted
 * by Systems.  A system can use one more more components to achieve its behavior.
 *
 * For example an ActsLikeEnemy type of system might need to use the entity's
 * position and rotation and damage components to determine where to move, how
 * quickly to move or whether to play a dying animation.
 */
export interface ComponentObj {
  transform?: {
    position?: number[];
    rotation?: number[];
    scaling?: number[];
    parent?: string;
  };
  shape?: BoxShape | SphereShape | CylinderShape | PlaneShape | CapsuleShape;
  acts_like_lift?: {
    state?: "up" | "down" | "going-up" | "going-down";
    height?: number;
    speed?: number;
  };
  floor?: any;
  avatar?: {
    head: PosRot;
    left?: PosRot | null;
    right?: PosRot | null;
  };
  lighting?: any;
  material?: { name: "color"; color_string: string } | { name: "grid" };
  attendance?: {
    mic_muted?: boolean;
    nickname?: string;
    collectable_values?: Record<string, number>;
    collectable_items?: string[];
  };
  holdable?: {
    offset?: { pos: number[]; rot: number[] };
  };
  throwable?: {
    type:
    | "physics_simulator" // use physics imposters, can't predict where this object ends up
    | { linear: number } // animate the object in a straight line at this constant speed M/s
    | { dampening: number }; // slight floaty effect when object is released, object comes to a halt quickly
  };
  triggerable?: {
    type: "discreet" | "continuous";
  };
  // targetable? // able to be shot at
  // two_hand_scale?
  // button
  // joystick
  // lever

  // grabbable?: {
  //   type?: "relative_parent" | "fixed_parent" | "pivot";
  //   offset_position?: number[];
  //   offset_rotation?: number[];
  //   pivot_axis?: string;
  //   pivot_offset?: number[];
  //   throwable?: "keep" | "discard";
  //   shootable?: "continuous" | "discreet";
  // };
  serialized_mesh?: { mesh_id: string; path: string };
  collectable?: { value?: { label: string; amount: number }; item?: string };
  gun?: any;
  spin?: { speed: number[] };
  [anykey: string]: any;
}
