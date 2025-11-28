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
    // Wait for backend to be available before attempting login
    const serverUrl = Cypress.env("NG_APP_SERVER_URL") || "http://localhost:8081/api";
    
    cy.request({
      url: `${serverUrl}/auths/auto-login`,
      retryOnStatusCodeFailure: true,
      timeout: 30000,
      failOnStatusCode: false,
    }).then(() => {
      // Backend is ready (returns 200 or 401, but not connection error), proceed with login
      cy.visit("/connexion", { timeout: 15000 });
      cy.get("input[type=email]", { timeout: 15000 }).type(user.email);
      cy.get("input[type=password]").type(user.password);
      cy.get(".password-line").get("#printPassword").click();
      cy.get("form").submit();

      cy.wait(20000);
    });
  });
});
