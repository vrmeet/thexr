/// <reference types="svelte" />

import type { Context } from "../context";
import type { IService } from "./service";

import App from "../svelte/App.svelte";

export class ServiceStartModal implements IService {
  name: "service-start_modal";
  init(context: Context) {
    new App({
      target: document.body,
      props: {
        context: context,
      },
    });
  }
}
