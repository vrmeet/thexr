/// <reference types="cypress" />

import type { Synergize } from "../../../js/synergizer";
import { SystemInline } from "../../../js/ecs/systems/system-inline";
import { SystemAvatar } from "../../../js/ecs/systems/system-avatar";
import type { IEntityCreatedEvent, IMemberMovedEvent } from "../../../js/types";
import { EventName } from "../../../js/event-names";
import type { ComponentObj } from "../../../js/ecs/components/component-obj";
import { SystemLighting } from "../../../js/ecs/systems/system-lighting";
describe("inline system", () => {
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
      synergizer.addSystem(new SystemInline());
      synergizer.addSystem(new SystemLighting());
      synergizer.addSystem(new SystemAvatar());
    });
  });

  it("creates an avatar", () => {
    const entity_id = "member123";
    const avatarCreated: IEntityCreatedEvent = {
      m: EventName.entity_created2,
      p: {
        entity_id: entity_id,
        components: <ComponentObj>{
          avatar: true,
        },
      },
    };
    const lightCreated: IEntityCreatedEvent = {
      m: EventName.entity_created2,
      p: {
        entity_id: "light1",
        components: <ComponentObj>{
          lighting: true,
        },
      },
    };
    synergizer.context.signalHub.incoming.emit("event", lightCreated);
    synergizer.context.signalHub.incoming.emit("event", avatarCreated);

    cy.get("canvas").trigger("keydown", { keyCode: 83, release: false });
    cy.wait(500);
    cy.get("canvas")
      .trigger("keyup", { keyCode: 83, release: false })
      .then(() => {
        // expect(synergizer.freeCamera.position.asArray()).to.not.eql([0, 0, 0]);
        const avatar =
          synergizer.context.scene.getTransformNodeByName(entity_id);
        assert(avatar);
        synergizer.debug();
      });
  });
});
