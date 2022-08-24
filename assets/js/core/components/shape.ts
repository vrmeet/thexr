export type ShapeComponent = BoxShape | SphereShape; //| Barrier;
// export type DoorComponent = { token: string; state: "open" | "closed" };

// export interface Barrier {
//   prim: "barrier";
//   prim_params: {
//     points: number[];
//     height?: number;
//   };
// }

export interface BoxShape {
  prim: "box";
  prim_params: {
    width?: number;
    height?: number;
    depth?: number;
  };
}

export interface SphereShape {
  prim: "sphere";
  prim_params: {
    diameter: number;
  };
}
