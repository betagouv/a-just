/**
 * A-JUST context builder for E2E test reporting
 * Attaches user, backup, and rights info to Cypress tests for Mochawesome
 */

import user from "../fixtures/user.json";

/**
 * Build A-JUST context from current test state
 * @returns Context object with user, backup, and rights
 */
export function buildAJustContextE2E(): any {
  const backupId = window.localStorage.getItem("backupId");
  const token = window.localStorage.getItem("token");

  const ctx = {
    user: {
      email: user.email || null,
      id: null, // Will be populated if we fetch user data
    },
    backup: {
      id: backupId ? parseInt(backupId, 10) : null,
      label: null, // Could be fetched from HR API if needed
    },
    rights: {
      tools: [
        { name: "Panorama", canRead: true, canWrite: true },
        { name: "Ventilations", canRead: true, canWrite: true },
        { name: "Données d'activité", canRead: true, canWrite: true },
        { name: "Temps moyens", canRead: true, canWrite: true },
        { name: "Cockpit", canRead: true, canWrite: true },
        { name: "Simulateur", canRead: true, canWrite: true },
        { name: "Simulateur à blanc", canRead: true, canWrite: true },
        { name: "Réaffectateur", canRead: true, canWrite: true },
      ],
      referentiels: "all", // E2E test user has access to all referentiels
    },
  };

  return ctx;
}

/**
 * Attach A-JUST context to current Cypress test
 * Call this in beforeEach or at the start of critical tests
 */
export function attachAJustContext() {
  const ctx = buildAJustContextE2E();
  
  // Attach to Cypress test context for mochawesome-reporter
  // The reporter will serialize this into the JSON output
  cy.wrap(null, { log: false }).then(() => {
    const currentTest = (Cypress as any).mocha?.getRunner()?.suite?.ctx?.currentTest;
    if (currentTest) {
      currentTest.ajustContext = JSON.stringify(ctx);
    }
  });
}
