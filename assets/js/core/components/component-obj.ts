import type { ActsLikeLiftComponent } from "./acts-like-lift";
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
}
