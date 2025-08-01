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

// Alternatively you can use CommonJS syntax:
// require('./commands')
require("cy-verify-downloads").addCustomCommand();

before(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.reload();
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
