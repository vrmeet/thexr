/// <reference types="svelte" />

import type { Context } from "../context";
import type { IService } from "./service";

import App from "../App.svelte";

export class ServiceStartModal implements IService {
  name: "service-start_modal";
  init(context: Context) {
    new App({
      target: document.body,
      props: {
        space_id: context.space_id,
        member_id: context.my_member_id,
        signalHub: context.signalHub,
      },
    });
  }
}
