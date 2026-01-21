// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";
import addCustomCommand from "cy-verify-downloads";
import "cypress-mochawesome-reporter/register";
import { attachAJustContext } from "./ajust-context";

// Alternatively you can use CommonJS syntax:
// require('./commands')
require("cy-verify-downloads").addCustomCommand();

before(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.task('wipeDownloads');
  cy.task('wipeEffectifArtifacts');
  cy.reload();
});

// Always dump DOM after each test for debugging
afterEach(function () {
  if (Cypress.env('DISABLE_SNAPSHOT_AFTER_EACH')) {
    return;
  }
  const titleSafe = (this.currentTest && typeof this.currentTest.fullTitle === 'function')
    ? this.currentTest.fullTitle().replace(/[^a-z0-9-_]+/gi, '_').slice(0, 120)
    : 'unknown_test';
  cy.document().then((doc) => {
    const html = doc.documentElement.outerHTML;
    cy.writeFile(`cypress/reports/dom-after-${titleSafe}.html`, html);
  });
});

// Optionally clean artifacts after the whole run, unless KEEP_ARTIFACTS is set
after(() => {
  if (!Cypress.env('KEEP_ARTIFACTS')) {
    cy.task('wipeEffectifArtifacts');
  }
});

// Ignore ResizeObserver errors
Cypress.on("uncaught:exception", (err, runnable) => {
  if (
    err.message.includes(
      "ResizeObserver loop completed with undelivered notifications"
    )
  ) {
    return false;
  }
  return true;
});
