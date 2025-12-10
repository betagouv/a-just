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
 * This attaches context immediately to the test object, using static data
 * The context will be serialized into Mochawesome JSON for the report
 */
export function attachAJustContext() {
  try {
    // Get the current Mocha test object
    const runner = (Cypress as any).mocha?.getRunner();
    const currentTest = runner?.suite?.ctx?.currentTest || runner?.test;
    
    if (!currentTest) {
      return;
    }
    
    // Build static context (we can't access localStorage in beforeEach before page visit)
    const ctx = {
      user: {
        email: user.email || null,
        id: null,
      },
      backup: {
        id: null, // Will be null in beforeEach, but that's OK
        label: null,
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
        referentiels: "all",
      },
    };
    
    // Attach as JSON string to match API test format
    currentTest.ajustContext = JSON.stringify(ctx);
  } catch (error) {
    // Silently fail if we can't attach context
    console.warn('Failed to attach A-JUST context:', error);
  }
}
