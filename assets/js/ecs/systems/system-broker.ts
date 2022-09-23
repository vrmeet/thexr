import type { ISystem } from "../system";
import type { Context } from "../../context";

class SystemBroker implements ISystem {
  public name = "system-broker";
  public context: Context;
  init(context: Context) {
    this.context = context;
  }

  dispose() {}
}

window["system-transform"] = new SystemBroker();
