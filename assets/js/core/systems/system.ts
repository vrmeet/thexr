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

/**
 * Interface implemented by classes supporting systems
 */
export interface ISystemAware<T> {
  /**
   * Attach a system
   * @param system defines the system to attach
   * @returns the current host
   */
  addSystem(system: System<T>): T;
  /**
   * Remove a system from the current object
   * @param name defines the system to detach
   * @returns the current host
   */
  removeSystem(name: string): T;
  /**
   * Gets a system using its name to search
   * @param name defines the name to search
   * @returns the system or null if not found
   */
  getSystemByName(name: string): BABYLON.Nullable<System<T>>;
}
