/// <reference types="cypress" />

describe("App", () => {
  it("should load the home page without errors", () => {
    cy.visit("/");
  });

  it("should match the home page snapshot", () => {
    cy.visit("/");
    cy.percySnapshot("Home Page");
  });
}); 