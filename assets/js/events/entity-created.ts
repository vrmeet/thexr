import type { ComponentObj } from "../ecs/components/component-obj";
import type { IEvent } from "./event-base";

// export type EventEntityCreated = {
//   m: "entity_created";
//   p: {
//     entity_id: string;
//     components: ComponentObj;
//   };
// };

export interface EventEntityCreated extends IEvent {
  m: "entity_created";
  p: { entity_id: string; components: ComponentObj };
}
