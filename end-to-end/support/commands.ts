import user from "../fixtures/user.json";

/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      // drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
    }
  }
}

Cypress.Commands.add("login", () => {
  cy.clearLocalStorage();
  cy.clearCookies();

  cy.session("login", () => {
    cy.visit("/connexion");
    cy.get("input[type=email]").type(user.email);
    cy.get("input[type=password]").type(user.password);
    cy.get(".password-line").get("#printPassword").click();
    cy.get("form").submit();

    // Wait for the token to be stored in localStorage (confirms login succeeded)
    cy.window().its("localStorage").invoke("getItem", "token").should("exist");
    // Also wait for navigation away from login page
    cy.url().should("not.include", "/connexion");
  });
});
