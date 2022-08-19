import type * as BABYLON from "babylonjs";
import type { Entity } from "../core/entities/entity";

export class ShapeBehavior implements BABYLON.Behavior<Entity> {
  public name = "shape_behavior";

  init() {}

  attach(entity) {}

  detach() {}
}
