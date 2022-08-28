import { Entity } from "../../../ecs/entities/entity";
import { describe, beforeEach, test } from "../../helper/runner";
import { systems } from "../../../ecs/systems/systems";
import * as BABYLON from "babylonjs";
import { expect } from "chai";

describe("shape system", () => {
  let engine: BABYLON.Engine = new BABYLON.NullEngine();
  let scene: BABYLON.Scene;

  beforeEach(() => {
    if (scene) {
      scene.dispose();
    }
    scene = new BABYLON.Scene(engine);
    systems.initAll("me", scene);
  });

  test("every entity has a default mesh", () => {
    let entity = new Entity("my entity", {}, scene);
    expect(entity.mesh).to.be.ok;
  });

  test("a box shape component makes a babylon js box", () => {
    let entity = new Entity(
      "box entity",
      { shape: { prim: "box", prim_params: { height: 1, depth: 2 } } },
      scene
    );
    expect(entity.mesh.getTotalVertices()).to.equal(24);
  });

  test("if position component present, mesh will be in that position", () => {
    let entity = new Entity(
      "box entity",
      {
        shape: { prim: "box", prim_params: { height: 1, depth: 2 } },
        position: [1, 2, 3],
      },
      scene
    );
    expect(entity.mesh.position.asArray()).to.eql([1, 2, 3]);
  });
});
