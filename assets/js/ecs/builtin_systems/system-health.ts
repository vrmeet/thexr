import type { Context } from "../../context";
import type { ISystem } from "./isystem";

export class SystemHealth implements ISystem {
  public name = "health";
  public order = 20;
  public context: Context;
  init(context: Context) {
    this.context = context;
  }
}
