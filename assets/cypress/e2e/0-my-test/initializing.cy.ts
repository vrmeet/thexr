/// <reference types="cypress" />

import { filter } from "rxjs/operators";
import { EventName } from "../../../js/event-names";
import type { SignalHub } from "../../../js/signalHub";
import { Synergize } from "../../../js/synergizer";
import { random_id } from "../../../js/utils/misc";

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress

describe("initalizing space", () => {
  let context;
  let synergizer: Synergize;
  let camera: BABYLON.FreeCamera;
  let window;
  let sh: SignalHub;
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit("http://localhost:4000/test");
    cy.get("canvas").click();
    cy.window().then((win) => {
      window = win;
      synergizer = win["synergizer"] as Synergize;
      context = win["context"];
      camera = synergizer.scene.activeCamera as unknown as BABYLON.FreeCamera;
      sh = win["signalHub"];
      sh.local.on("keyboard_info").subscribe((evt) => {
        console.log(evt.event.keyCode);
      });
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
    cy.wait(1000);

    console.log("sending message");
    sh.incoming.emit("event", event as any);
    cy.wait(100);
    synergizer.debug();
  });
  it("inline 2D navigation", () => {
    expect(camera.position.asArray()).to.eql([0, 0, 0]);
    cy.get("canvas").trigger("keydown", { keyCode: 83, release: false });
    cy.wait(300);
    cy.get("canvas")
      .trigger("keyup", { keyCode: 83, release: false })
      .then(() => {
        expect(camera.position.asArray()).to.not.eql([0, 0, 0]);
      });
  });
});
