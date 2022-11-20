import type { IComponent } from "./icomponent";
import type { XRS } from "./xrs";

export interface ISystem {
  name: string;
  order: number;
  init(xrs: XRS): void;
  buildComponent?(): IComponent;
}
