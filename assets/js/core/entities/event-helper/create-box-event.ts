import type { EventEntityCreated } from "../../events/entity-created";
import { random_id } from "../../../utils/misc";

export const createBoxEvent = (opts: {
  size?: number;
  width?: number;
  depth?: number;
  height?: number;
}): EventEntityCreated => {
  return {
    m: "entity_created",
    p: {
      entity_id: `box_${random_id(3)}`,
      components: {
        shape: { prim: "box", prim_params: opts },
      },
    },
  };
};
