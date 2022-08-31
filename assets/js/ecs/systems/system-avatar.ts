import type { Context } from "../../context";
import type { Entity } from "../entities/entity";
import type { ISystem } from "./system";
import type { Avatar } from "../../scene/avatar";

export class SystemAvatar implements ISystem {
  name: "avatar";
  public avatars: Record<string, Avatar> = {};
  init(context: Context) {}
  initEntity(entity: Entity) {}
  dispose() {}
}
