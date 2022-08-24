import { Entity } from "../../../core/entities/entity";
import { describe, beforeEach, test } from "../../helper/runner";
import * as systems from "../../../core/systems";
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
  });

  test("every entity has a default mesh", () => {
    let entity = new Entity("my entity", {}, scene);
    systems.shape.initEntity(entity);
    expect(entity.mesh).to.be.ok;
  });
});
