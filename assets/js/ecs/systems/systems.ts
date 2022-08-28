import type { SystemShape } from "./system-shape";
import type { SystemLift } from "./system-lift";
import type * as BABYLON from "babylonjs";
import type { Entity } from "../entities/entity";
import type { SystemBase } from "./system-base";

/**
 * An object to hold ALL the systems, though not each system needs to be present
 * This way in tests, pass just the system under testing to this constructor
 */
export class Systems {
  // typed attributes allow us to access every system and get access to their methods
  public shape?: BABYLON.Nullable<SystemShape>;
  public lift?: BABYLON.Nullable<SystemLift>;

  constructor(public systems: SystemBase[]) {
    systems.forEach((system) => {
      this[system.name] = system;
    });
  }
  // initAll(member_id: string, scene: BABYLON.Scene) {
  //   Object.keys(this).forEach((system) => {
  //     this[system].init(member_id, scene);
  //   });
  // }
  /**
   * Given a new entity, pass it through every system
   */
  initEntityAll(entity: Entity) {
    this.systems.forEach((system) => {
      system.initEntity(entity);
    });
  }
}

// export const systems = new Systems();
