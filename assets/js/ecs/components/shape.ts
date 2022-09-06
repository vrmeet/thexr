export type ShapeComponent =
  | BoxShape
  | SphereShape
  | CylinderShape
  | PlaneShape
  | CapsuleShape;
//| Barrier;
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
    segments?: number;
    diameter?: number;
    diameterX?: number;
    diameterY?: number;
    diameterZ?: number;
    arc?: number;
    slice?: number;
  };
}

export interface CylinderShape {
  prim: "cylinder";
  prim_params: {
    height?: number;
    diameterTop?: number;
    diameterBottom?: number;
    diameter?: number;
    tessellation?: number;
    subdivisions?: number;
    arc?: number;
  };
}

export interface PlaneShape {
  prim: "plane";
  prim_params: {
    size?: number;
    width?: number;
    height?: number;
  };
}

export interface CapsuleShape {
  prim: "capsule";
  prim_params: {
    subdivisions?: number;
    tessellation?: number;
    height?: number;
    radius?: number;
    capSubdivisions?: number;
  };
}
