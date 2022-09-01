/// <reference types="cypress" />

import type { Synergize } from "../../../js/synergizer";
import { SystemInline } from "../../../js/ecs/systems/system-inline";
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
      // synergizer.addSystem(new SystemInline());
    });
  });

  it("inline 2D navigation", () => {
    expect(synergizer.freeCamera.position.asArray()).to.eql([0, 0, 0]);
    cy.get("canvas").trigger("keydown", { keyCode: 83, release: false });
    cy.wait(300);
    cy.get("canvas")
      .trigger("keyup", { keyCode: 83, release: false })
      .then(() => {
        expect(synergizer.freeCamera.position.asArray()).to.not.eql([0, 0, 0]);
      });
  });
});
