/// <reference types="svelte" />

import type { Context } from "../../context";
import type { ISystem } from "./isystem";

import App from "../../svelte/App.svelte";

export class SystemStartModal implements ISystem {
  name = "service-start_modal";
  public order = 8;
  init(context: Context) {
    // wait until system has loaded all the plugins
    // otherwise this modal might cause race condition
    // where channel is connected before material system is loaded
    context.signalHub.local.on("system_started").subscribe(() => {
      new App({
        target: document.body,
        props: {
          context: context,
        },
      });
    });
  }
}
