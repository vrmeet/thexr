import { filter, map, pipe, scan } from "rxjs";

import * as BABYLON from "babylonjs";
import * as MAT from "babylonjs-materials";
import type { PosRot } from "../types";

export const randomDiceRoll = (diceSides: number) => {
  return Math.random() * Math.floor(diceSides);
};

export const findOrCreateMaterial = (
  opts: { type: "color" | "grid"; colorString?: string },
  scene: BABYLON.Scene
) => {
  if (opts.type === "color" && opts.colorString) {
    let mat = scene.getMaterialByName(`mat_${opts.colorString}`);
    if (mat) {
      return mat;
    } else {
      let myMaterial = new BABYLON.StandardMaterial(
        `mat_${opts.colorString}`,
        scene
      );
      let color = BABYLON.Color3.FromHexString(opts.colorString);
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
  return value.map(el => reduceSigFigs(el));
};

export const unsetPosRot = (mesh: BABYLON.AbstractMesh) => {
  mesh.position.copyFromFloats(0, 0, 0);
  mesh.rotationQuaternion.copyFromFloats(0, 0, 0, 1);
};

export function random_id(length: number) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
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
    filter(data => data.diff > movementDelta),
    map(data => data.posRot)
  );
}
