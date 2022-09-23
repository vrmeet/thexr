/// <reference types="cypress" />

import type { Synergize } from "../../../js/synergizer";
import { random_id } from "../../../js/utils/misc";
import type { BoxShape, SphereShape } from "../../../js/ecs/components/shape";
import type { MaterialComponent } from "../../../js/ecs/components/material";

describe("shape system", () => {
  let synergizer: Synergize;
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit("http://localhost:4000/test");
    cy.get("canvas").click();
    cy.window().then(async (win) => {
      synergizer = win["synergizer"] as Synergize;
      synergizer.debug();
      await synergizer.addSystem(
        "http://localhost:4000/systems/system-lighting.js",
        "system-lighting"
      );
      await synergizer.addSystem(
        "http://localhost:4000/systems/system-shape.js",
        "system-shape"
      );
      await synergizer.addSystem(
        "http://localhost:4000/systems/system-transform.js",
        "system-transform"
      );
      await synergizer.addSystem(
        "http://localhost:4000/systems/system-material.js",
        "system-material"
      );
      console.log(synergizer.systems);
      //create a light
      const event = {
        id: `light_${random_id(3)}`,
        components: {
          lighting: true,
        },
      };
      synergizer.context.signalHub.incoming.emit("entity_created", event);
    });
  });
  it("creates a box", () => {
    const event = {
      id: `box_${random_id(3)}`,
      components: {
        shape: <BoxShape>{ prim: "box", prim_params: { width: 3 } },
        position: [0, 0, 5],
      },
    };
    synergizer.context.signalHub.incoming.emit("entity_created", event);
    expect(synergizer.scene.meshes.length).to.eql(1);
  });
  it("creates a sphere", () => {
    const event = {
      id: `sphere_${random_id(3)}`,
      components: {
        shape: <SphereShape>{ prim: "sphere", prim_params: {} },
        position: [5, 0, 5],
        scaling: [2, 5, 2],
        material: <MaterialComponent>{ name: "color", color_string: "#FF0000" },
      },
    };
    synergizer.context.signalHub.incoming.emit("entity_created", event);
    expect(synergizer.scene.meshes.length).to.eql(2);
  });
});
