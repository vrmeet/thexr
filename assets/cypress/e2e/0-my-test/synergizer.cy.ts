/// <reference types="cypress" />

import * as BABYLON from "babylonjs";

import { Synergize } from "../../../js/synergizer";

describe("synergizer", () => {
  it("creates a scene", () => {
    const engine = new BABYLON.NullEngine();
    const synergizer = new Synergize(engine, []);
    expect(synergizer.scene).to.be.ok;
  });
  it("creates a default camera", () => {
    const engine = new BABYLON.NullEngine();
    const synergizer = new Synergize(engine, []);
    expect(synergizer.scene.cameras?.length).to.be.greaterThan(0);
  });
  it("starts update loop", () => {
    const engine = new BABYLON.NullEngine();
    const synergizer = new Synergize(engine, []);
  });
  it("initializes systems given it", () => {
    const engine = new BABYLON.NullEngine();
    let system = {
      name: "my-system",
      init: () => {},
      dispose: () => {},
    };
    const synergizer = new Synergize(engine, [system]);
    expect(synergizer.systems.length).to.eql(1);
  });
});
