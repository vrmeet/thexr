/// <reference types="cypress" />
import * as BABYLON from "babylonjs";
import type { Synergize } from "../../../js/synergizer";
import type {
  IEntityCreatedEvent,
  IMemberMovedEvent,
  IMemberEnteredEvent,
} from "../../../js/types";
import { EventName } from "../../../js/event-names";
import type { ComponentObj } from "../../../js/ecs/components/component-obj";
import type { SystemAvatar } from "../../../js/ecs/builtin_systems/system-avatar";
describe("inline system", () => {
  let synergizer: Synergize;
  let avatarSystem;
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit("http://localhost:4000/test");
    cy.get("canvas").click();
    cy.window().then((win) => {
      synergizer = win["synergizer"] as Synergize;

      const lightCreated: IEntityCreatedEvent = {
        m: EventName.entity_created2,
        p: {
          entity_id: "light1",
          components: <ComponentObj>{
            lighting: true,
          },
        },
      };
      const gridCreated: IEntityCreatedEvent = {
        m: EventName.entity_created2,
        p: {
          entity_id: "floor",
          components: <ComponentObj>{
            shape: { prim: "plane", prim_params: { size: 10 } },
            rotation: [BABYLON.Angle.FromDegrees(90).radians(), 0, 0],
            material: { name: "grid" },
          },
        },
      };
      synergizer.context.signalHub.incoming.emit("event", lightCreated);
      // synergizer.context.signalHub.incoming.emit("event", avatarCreated);
      synergizer.context.signalHub.incoming.emit("event", gridCreated);
      console.log("syn", synergizer);
      avatarSystem = synergizer.getSystemByName("avatar") as SystemAvatar;
    });
  });

  it("creates an avatar on 'member_entered'", () => {
    const memberEnteredEvent: IMemberEnteredEvent = {
      m: EventName.member_entered,
      p: {
        member_id: "avatar1",
        pos_rot: { pos: [0, 0, 0], rot: [0, 0, 0, 1] },
        state: {
          mic_muted: true,
          nickname: "bob",
          health: 100,
          status: "active",
        },
      },
    };
    synergizer.context.signalHub.incoming.emit("event", memberEnteredEvent);
    cy.get("canvas").trigger("keydown", { keyCode: 83, release: false });
    cy.wait(1000);
    cy.get("canvas")
      .trigger("keyup", { keyCode: 83, release: false })
      .then(() => {
        expect(avatarSystem.countAvatars()).to.greaterThan(0);
      });
  });

  it("moves avatar when 'member_moved'", () => {
    const movementEvent: IMemberMovedEvent = {
      m: EventName.member_moved,
      p: {
        member_id: "avatar1",
        pos_rot: { pos: [1, 0, 0], rot: [0, 0, 0, 1] },
      },
    };
    synergizer.context.signalHub.incoming.emit("event", movementEvent);
    cy.wait(100).then(() => {
      synergizer.debug();
    });
  });
});
