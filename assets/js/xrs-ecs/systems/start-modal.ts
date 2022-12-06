import type { ISystem } from "../system";
import type { XRS } from "../xrs";

import App from "../../svelte/App.svelte";
import type { Context } from "../context";

export class SystemStartModal implements ISystem {
  public xrs: XRS;
  public context: Context;
  name = "start-modal";
  setup(xrs: XRS) {
    this.xrs = xrs;
    this.context = xrs.context;
    this.context.signalHub.local.on("system_started").subscribe(() => {
      if (this.context.bypass_modal) {
        // eslint-disable-next-line no-inner-declarations
        // function firstInteraction() {
        //
        //   window.removeEventListener("click", firstInteraction);
        this.context.signalHub.local.emit("client_ready", "enter");
        // }
        // window.addEventListener("click", firstInteraction);
      } else {
        this.insertModal();
      }
    });
  }
  insertModal() {
    new App({
      target: document.body,
      props: {
        context: this.context,
      },
    });
  }
}
