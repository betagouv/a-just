import user from "../fixtures/user.json";
import { ensureE2EUserReady } from "./api";

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
      login(): Chainable<void>;
      // drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
    }
  }
}

Cypress.Commands.add("login", () => {
  cy.task("log", "[LOGIN] Clearing localStorage and cookies...");
  cy.clearLocalStorage();
  cy.clearCookies();

  // Les droits sont réappliqués côté API avant le login UI: sans accès ni
  // ventilation, l'application redirige vers /bienvenue au lieu de /panorama.
  cy.task("log", "[LOGIN] Restoring default permissions via API...");
  ensureE2EUserReady();

  cy.task("log", "[LOGIN] Starting cy.session()...");
  cy.session("login", () => {
    cy.task("log", "[LOGIN] Visiting /connexion...");
    cy.visit("/connexion", { timeout: 15000 });
    cy.task("log", "[LOGIN] Page loaded, looking for email input...");
    cy.get("input[type=email]", { timeout: 15000 }).type(user.email);
    cy.task("log", "[LOGIN] Email entered, looking for password input...");
    cy.get("input[type=password]").type(user.password);
    cy.task("log", "[LOGIN] Password entered, clicking show password...");
    cy.get(".password-line").get("#printPassword").click();
    cy.task("log", "[LOGIN] Submitting form...");
    cy.get("form").submit();

    cy.task("log", "[LOGIN] Form submitted, waiting for redirection...");
    cy.location("pathname", { timeout: 60000 }).should("include", "/panorama");
    cy.task("log", "[LOGIN] Redirected to /panorama, login is done");
  });
  cy.task("log", "[LOGIN] cy.session() completed");
});
