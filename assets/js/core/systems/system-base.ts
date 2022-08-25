import type { Entity } from "../entities/entity";
import type * as BABYLON from "babylonjs";

export abstract class SystemBase {
  public scene: BABYLON.Scene;
  public my_member_id: string;

  init(my_member_id: string, scene: BABYLON.Scene) {
    this.scene = scene;
    this.my_member_id = my_member_id;
    this.afterInit();
  }
  /**
   * afterInit runs after scene and my_member_id is set
   * and gives the system a chance to register to events
   * for keyboard or pointer events, filtering by this member id or other
   * conditions
   */
  abstract afterInit(): void;

  abstract initEntity(entity: Entity): void;
}
