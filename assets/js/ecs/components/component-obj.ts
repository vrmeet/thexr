import type { PosRot } from "../../types";
import type { ActsLikeLiftComponent } from "./acts-like-lift";
import type { MaterialComponent } from "./material";
import type { ShapeComponent } from "./shape";

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
  position?: number[];
  rotation?: number[];
  scaling?: number[];
  shape?: ShapeComponent;
  acts_like_lift?: ActsLikeLiftComponent;
  acts_like_floor?: any;
  avatar?: {
    head: PosRot;
    left?: PosRot | null;
    right?: PosRot | null;
  };
  lighting?: any;
  material?: MaterialComponent;
  mic_muted?: boolean;
  nickname?: string;
  grabbable?: { pickup?: "any" | "fixed"; lever?: any; grabbed_by: string };
  parent?: string;

  [anykey: string]: any;
}
