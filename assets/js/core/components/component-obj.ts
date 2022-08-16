import type { DoorComponent, ShapeComponent } from "./shape";

export interface ComponentObj {
  position?: number[];
  shape?: ShapeComponent;
  door?: DoorComponent;
}
