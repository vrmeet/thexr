import type * as BABYLON from "babylonjs";

/**
 * Interface used to define a component
 */
export interface Component<T> {
  /** gets or sets component's name */
  name: string;

  /**
   * Function called when the component needs to be initialized (after attaching it to a target)
   */
  init(): void;
  /**
   * Called when the component is attached to a target
   * @param target defines the target where the component is attached to
   */
  attach(target: T): void;
  /**
   * Called when the component is detached from its target
   */
  detach(): void;
}

/**
 * Interface implemented by classes supporting components
 */
export interface IComponentAware<T> {
  /**
   * Attach a component
   * @param component defines the component to attach
   * @returns the current host
   */
  addComponent(component: Component<T>): T;
  /**
   * Remove a component from the current object
   * @param name defines the component to detach
   * @returns the current host
   */
  removeComponent(name: string): T;
  /**
   * Gets a component using its name to search
   * @param name defines the name to search
   * @returns the component or null if not found
   */
  getComponentByName(name: string): BABYLON.Nullable<Component<T>>;
}
