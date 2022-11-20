import type { ISystem } from "../isystem";
import type { XRS } from "../xrs";
import * as BABYLON from "babylonjs";
import Ammo from "ammojs-typed";
import * as sessionPersistance from "../../sessionPersistance";
import type { Context } from "../context";
import { camPosRot } from "../../utils/misc";
import { BaseSystem } from "../base-system";
export class SystemBroker extends BaseSystem {
  public name: "broker";
  public order = 0;
  public context: Context;

  init(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
  }
}
