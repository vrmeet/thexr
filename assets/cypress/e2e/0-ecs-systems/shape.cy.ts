/// <reference types="cypress" />

import { EventName } from "../../../js/event-names";
import type { Synergize } from "../../../js/synergizer";
import { random_id } from "../../../js/utils/misc";
import type { IEntityCreatedEvent } from "../../../js/types";
import type { BoxShape, SphereShape } from "../../../js/ecs/components/shape";

describe("shape system", () => {
  let synergizer: Synergize;
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit("http://localhost:4000/test");
    cy.get("canvas").click();
    cy.window().then((win) => {
      synergizer = win["synergizer"] as Synergize;
      synergizer.debug();
      // synergizer.addSystem(new SystemShape());
    });
  });
  it("creates a box", () => {
    const event = {
      id: `box_${random_id(3)}`,
      components: {
        shape: <BoxShape>{ prim: "box", prim_params: {} },
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
      },
    };
    synergizer.context.signalHub.incoming.emit("entity_created", event);
    expect(synergizer.scene.meshes.length).to.eql(2);
  });
});
