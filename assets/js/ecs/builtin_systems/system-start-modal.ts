/// <reference types="svelte" />

import type { Context } from "../../context";
import type { ISystem } from "./isystem";

import App from "../../svelte/App.svelte";

export class SystemStartModal implements ISystem {
  name = "start-modal";
  public order = 10;
  public context: Context;
  init(context: Context) {
    this.context = context;
    // wait until system has loaded all the plugins
    // otherwise this modal might cause race condition
    // where channel is connected before material system is loaded
    this.context.signalHub.local.on("system_started").subscribe(() => {
      if (context.bypass_modal) {
        context.signalHub.local.emit("client_ready", "enter");
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
