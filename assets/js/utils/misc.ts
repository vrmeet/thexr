import { filter, map, pipe, scan } from "rxjs";

import * as BABYLON from "babylonjs";
import * as MAT from "babylonjs-materials";
import type { PosRot } from "../types";
import { signalHub } from "../signalHub";
import type { Entity } from "../ecs/entities/entity";

const ANIMATION_FRAME_PER_SECOND = 60;

export const animateTranslation = (
  entity: Entity,
  endPos: BABYLON.Vector3,
  duration: number,
  callback: () => void,
  scene: BABYLON.Scene
) => {
  BABYLON.Animation.CreateAndStartAnimation(
    "translate",
    entity.mesh,
    "position",
    ANIMATION_FRAME_PER_SECOND,
    Math.ceil((duration * 60) / 1000),
    entity.mesh.position,
    endPos,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    null,
    callback,
    scene
  );
};

export const bindSceneObservablesToSignalHub = (scene: BABYLON.Scene) => {
  scene.onPointerObservable.add((pointerInfo) => {
    signalHub.local.emit("pointer_info", pointerInfo);
    console.log("pointerInfo", pointerInfo);
    if (
      pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN &&
      pointerInfo.pickInfo.hit &&
      pointerInfo.pickInfo.pickedMesh
    ) {
      console.log("a mesh was picked");
      signalHub.local.emit("mesh_picked", pointerInfo.pickInfo.pickedMesh);
    } else {
      console.log("no mesh was picked");
    }
  });
  scene.onKeyboardObservable.add((keyboardInfo) => {
    signalHub.local.emit("keyboard_info", keyboardInfo);
  });
};

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
