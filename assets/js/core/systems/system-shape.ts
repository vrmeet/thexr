import type * as BABYLON from "babylonjs";

/**
 * Interface used to define a system
 */
export interface System<T> {
  /** gets or sets system's name */
  name: string;

  /**
   * Function called when the system needs to be initialized (after attaching it to a target)
   */
  init(): void;
  /**
   * Called when the system is attached to a target
   * @param target defines the target where the system is attached to
   */
  attach(target: T): void;
  /**
   * Called when the system is detached from its target
   */
  detach(): void;
}
