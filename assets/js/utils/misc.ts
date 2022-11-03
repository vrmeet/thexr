import { filter, map, pipe, scan } from "rxjs";
import { Observable } from "rxjs";
import * as BABYLON from "babylonjs";
import * as MAT from "babylonjs-materials";
import type { PosRot } from "../types";
import type { Entity } from "../ecs/entities/entity";

const ANIMATION_FRAME_PER_SECOND = 60;

export const makeXRFrameSignal = (xrHelper: BABYLON.WebXRDefaultExperience) => {
  return new Observable<XRFrame>((subscriber) => {
    const obs = xrHelper.baseExperience.sessionManager.onXRFrameObservable.add(
      (value) => {
        subscriber.next(value);
      }
    );
    return () => {
      xrHelper.baseExperience.sessionManager.onXRFrameObservable.remove(obs);
    };
  });
};

export const detailOnWall = (maxHeight, maxWidth, maxDepth, scene) => {
  const height = (Math.random() * maxHeight) / 2 + 0.1;
  const depth = maxDepth;
  const width = (Math.random() * maxWidth) / 2 + 0.1;
  const detail = BABYLON.MeshBuilder.CreateBox(
    "",
    {
      height,
      width,
      depth,
    },
    scene
  );
  // lift above ground
  detail.position.y = Math.random() * (maxHeight - height) + height / 2;
  detail.position.x =
    Math.random() * (maxWidth - width) - (maxWidth - width) / 2;
  detail.position.z = Math.random() * maxDepth - maxDepth / 2;

  detail.bakeCurrentTransformIntoVertices();
  return detail;
};

export const detailedWall = (
  options: { height: number; depth: number; width: number },
  scene: BABYLON.Scene
) => {
  const base = BABYLON.MeshBuilder.CreateBox("", options, scene);
  base.position.y = options.height / 2;
  base.bakeCurrentTransformIntoVertices();
  // add some details
  const d = detailOnWall(options.height, options.width, options.depth, scene);
};

window["detailedWall"] = detailedWall;

export const randomEnv = (scene: BABYLON.Scene) => {
  function randomBox() {
    const depth = reduceSigFigs(Math.random() * 3) + 0.2;
    const width = reduceSigFigs(Math.random() * 2) + 0.2;
    const height = reduceSigFigs(Math.random() * 3) + 0.2;

    return BABYLON.MeshBuilder.CreateBox("", { depth, width, height }, scene);
  }

  for (let i = 0; i < 50; i++) {
    const b = randomBox();
    b.position.x = reduceSigFigs(Math.random() * 40) - 20;
    b.position.y = reduceSigFigs(Math.random() * 10);
    b.position.z = reduceSigFigs(Math.random() * 40) - 20;
  }
};

window["randEnv"] = randomEnv;

export const animateTranslation = (
  entity: Entity,
  endPos: BABYLON.Vector3,
  duration: number,
  callback: () => void,
  scene: BABYLON.Scene
) => {
  BABYLON.Animation.CreateAndStartAnimation(
    "translate",
    entity.transformNode,
    "position",
    ANIMATION_FRAME_PER_SECOND,
    Math.ceil((duration * 60) / 1000),
    entity.transformNode.position,
    endPos,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    null,
    callback,
    scene
  );
};

// export const bindSceneObservablesToSignalHub = (scene: BABYLON.Scene) => {
//   scene.onPointerObservable.add((pointerInfo) => {
//     signalHub.local.emit("pointer_info", pointerInfo);
//     console.log("pointerInfo", pointerInfo);
//     if (
//       pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN &&
//       pointerInfo.pickInfo.hit &&
//       pointerInfo.pickInfo.pickedMesh
//     ) {
//       console.log("a mesh was picked");
//       signalHub.local.emit("mesh_picked", pointerInfo.pickInfo.pickedMesh);
//     } else {
//       console.log("no mesh was picked");
//     }
//   });
//   scene.onKeyboardObservable.add((keyboardInfo) => {
//     signalHub.local.emit("keyboard_info", keyboardInfo);
//   });
// };

export const cameraFrontPosition = (scene: BABYLON.Scene, distance = 2.5) => {
  const forwardVec = scene.activeCamera
    .getDirection(BABYLON.Vector3.Forward())
    .normalize()
    .scaleInPlace(distance);
  const assetPosition = scene.activeCamera.position.add(forwardVec);
  return arrayReduceSigFigs(assetPosition.asArray());
};

export const cameraFrontFloorPosition = (
  scene: BABYLON.Scene,
  distance = 2.5
) => {
  const forwardVec = scene.activeCamera
    .getDirection(BABYLON.Vector3.Forward())
    .normalize()
    .scaleInPlace(distance);
  console.log("forwardVec", forwardVec);
  const assetPosition = scene.activeCamera.position.add(forwardVec);
  console.log("assetPosition", assetPosition);
  const ray = new BABYLON.Ray(assetPosition, BABYLON.Vector3.Down());
  ray.length = 20;
  console.log("ray", ray);
  const pickInfo = scene.pickWithRay(ray);

  console.log("pickInfo", pickInfo);
  if (pickInfo.hit) {
    return arrayReduceSigFigs(pickInfo.pickedPoint.asArray());
  } else {
    return assetPosition.asArray();
  }
};

export const randomDiceRoll = (diceSides: number) => {
  return Math.random() * Math.floor(diceSides);
};

export const findOrCreateMaterial = (
  opts: { type: "color" | "grid"; colorString?: string },
  scene: BABYLON.Scene
) => {
  if (opts.type === "color" && opts.colorString) {
    const mat = scene.getMaterialByName(`mat_${opts.colorString}`);
    if (mat) {
      return mat;
    } else {
      const myMaterial = new BABYLON.StandardMaterial(
        `mat_${opts.colorString}`,
        scene
      );
      const color = BABYLON.Color3.FromHexString(opts.colorString);
      myMaterial.diffuseColor = color;
      return myMaterial;
    }
  } else if (opts.type === "grid") {
    return (
      scene.getMaterialByName("mat_grid") ||
      new MAT.GridMaterial("mat_grid", scene)
    );
  }
};

export const hashCode = function (input: string) {
  let hash = 0,
    i: number,
    chr: number;
  if (input.length === 0) return hash;
  for (i = 0; i < input.length; i++) {
    chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const reduceSigFigs = (value: number) => {
  return Math.round(value * 100000) / 100000;
};
export const arrayReduceSigFigs = (value: number[]) => {
  return value.map((el) => reduceSigFigs(el));
};

export const unsetPosRot = (mesh: BABYLON.AbstractMesh) => {
  mesh.position.copyFromFloats(0, 0, 0);
  mesh.rotationQuaternion.copyFromFloats(0, 0, 0, 1);
};

export const getPosRot = (t: BABYLON.AbstractMesh, quaternion = true) => {
  return {
    pos: arrayReduceSigFigs(t.absolutePosition.asArray()),
    rot: arrayReduceSigFigs(
      quaternion ? t.absoluteRotationQuaternion.asArray() : t.rotation.asArray()
    ),
  };
};

export const camPosRot = (cam: BABYLON.Camera) => {
  return {
    pos: arrayReduceSigFigs(cam.position.asArray()),
    rot: arrayReduceSigFigs(cam.absoluteRotation.asArray()),
  };
};

export function deepMerge(target, source) {
  const isObject = (obj) => obj && typeof obj === "object";

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach((key) => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      target[key] = sourceValue;
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = deepMerge(Object.assign({}, targetValue), sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
}

export function showNormals(
  mesh: BABYLON.AbstractMesh,
  size: number,
  color: BABYLON.Color3,
  scene: BABYLON.Scene
) {
  const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
  const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  color = color || BABYLON.Color3.White();
  size = size || 1;
  console.log("got here", normals.length, positions.length);
  const lines = [];
  for (let i = 0; i < normals.length; i += 3) {
    const v1 = BABYLON.Vector3.FromArray(positions, i);
    const v2 = v1.add(BABYLON.Vector3.FromArray(normals, i).scaleInPlace(size));
    lines.push([v1.add(mesh.position), v2.add(mesh.position)]);
  }
  console.log("lines", lines);
  const normalLines = BABYLON.MeshBuilder.CreateLineSystem(
    "normalLines",
    { lines: lines },
    scene
  );
  console.log("normal lines");
  normalLines.color = color;
  return normalLines;
}
window["showNormals"] = showNormals;

export function random_id(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function cap(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function throttleByMovement(movementDelta: number) {
  return pipe(
    scan(
      (acc, curPosRot: PosRot) => {
        const newSum =
          curPosRot.pos[0] +
          curPosRot.pos[1] +
          curPosRot.pos[2] +
          curPosRot.rot[0] +
          curPosRot.rot[1] +
          curPosRot.rot[2] +
          curPosRot.rot[3];
        const diff = Math.abs(acc.sum - newSum);
        return { diff: diff, sum: newSum, posRot: curPosRot };
      },
      { diff: 0, sum: 0, posRot: { pos: [0, 0, 0], rot: [0, 0, 0, 1] } }
    ),
    filter((data) => data.diff > movementDelta),
    map((data) => data.posRot)
  );
}
