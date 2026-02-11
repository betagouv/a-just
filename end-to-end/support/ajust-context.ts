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
 * Writes context to a separate JSON file for report generation
 */
export function attachAJustContext(explicitFullTitle?: string) {
  // Get the current test title - try multiple methods
  let currentTest = (Cypress as any).currentTest;
  if (!currentTest) {
    currentTest = (Cypress as any).mocha?.getRunner()?.suite?.ctx?.currentTest;
  }
  if (!currentTest) {
    return cy.wrap(null);
  }
  
  // Determine test full title
  let testFullTitle: string;
  if (explicitFullTitle) {
    testFullTitle = explicitFullTitle;
  } else if (currentTest.fullTitle && typeof currentTest.fullTitle === 'function') {
    testFullTitle = currentTest.fullTitle();
  } else {
    // Manually construct full title from suite hierarchy
    const titles: string[] = [];
    let parent = currentTest.parent;
    while (parent) {
      if (parent.title) {
        titles.unshift(parent.title);
      }
      parent = parent.parent;
    }
    titles.push(currentTest.title);
    testFullTitle = titles.join(' ');
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
  
  // Write context to separate JSON file using Node.js task
  // Normalize the key to lowercase for case-insensitive lookup
  const contextFilePath = 'cypress/reports/test-contexts.json';
  const normalizedTitle = testFullTitle.toLowerCase();
  
  return cy.task('writeContextFile', {
    filePath: contextFilePath,
    testTitle: normalizedTitle,
    context: ctx
  });
}
