/// <reference types="svelte" />

import type { Context } from "../context";
import type { IService } from "./service";

import App from "../svelte/App.svelte";

export class ServiceStartModal implements IService {
  name: "service-start_modal";
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
