/// <reference types="cypress" />

import { EventName } from "../../../js/event-names";
import type { Synergize } from "../../../js/synergizer";
import { random_id } from "../../../js/utils/misc";
import { SystemShape } from "../../../js/ecs/systems/system-shape";

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
      synergizer.addSystem(new SystemShape());
    });
  });
  it("creates a box", () => {
    const event = {
      m: EventName.entity_created2,
      p: {
        entity_id: `box_${random_id(3)}`,
        components: {
          shape: { prim: "box", prim_params: {} },
        },
      },
    };
    synergizer.context.signalHub.incoming.emit("event", event as any);
    expect(synergizer.scene.meshes.length).to.eql(1);
  });
});
