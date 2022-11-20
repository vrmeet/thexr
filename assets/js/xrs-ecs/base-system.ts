import type { ISystem } from "./isystem";
import type { XRS } from "./xrs";

export abstract class BaseSystem implements ISystem {
  public xrs: XRS;
  abstract name: string;
  abstract order: number;
  init(xrs: XRS) {
    this.xrs = xrs;
  }
}
