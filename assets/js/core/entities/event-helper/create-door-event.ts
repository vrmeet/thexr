import type { EventEntityCreated } from "../../events/entity-created";
import { random_id } from "../../../utils/misc";

export const createDoorEvent = (opts: {
  points: number[];
  height?: number;
}): EventEntityCreated => {
  return {
    m: "entity_created",
    p: {
      entity_id: `door_${random_id(3)}`,
      components: {
        shape: { prim: "barrier", prim_params: opts },
        door: { token: "red", state: "closed" },
      },
    },
  };
};
