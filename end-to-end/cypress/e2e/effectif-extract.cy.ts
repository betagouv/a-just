/// <reference types="cypress" />

import user from "../../fixtures/user.json";

// Single-origin Effectif extraction spec (no cy.origin needed)
// Env:
// - TARGET_FRONT_URL: base URL to run against (falls back to SANDBOX_FRONT_URL)
// - BACKUP_LABEL: label of TJ tile (default: test010)
// - START, STOP: ISO dates YYYY-MM-DD (default: 2024-01-01 .. 2025-06-15)

const TARGET = String(Cypress.env("TARGET_FRONT_URL") || Cypress.env("SANDBOX_FRONT_URL") || "");
const BACKUP_LABEL = String(Cypress.env("BACKUP_LABEL") || "test010");
const START = String(Cypress.env("START") || "2024-01-01");
const STOP = String(Cypress.env("STOP") || "2025-06-15");

const FR_MONTHS = [
  "JANV.",
  "FÉVR.",
  "MARS",
  "AVR.",
  "MAI",
  "JUIN",
  "JUIL.",
  "AOÛT",
  "SEPT.",
  "OCT.",
  "NOV.",
  "DÉC.",
];

function snapshot(name: string) {
  cy.document().then((doc) => {
    cy.writeFile(`cypress/reports/${name}.html`, doc.documentElement.outerHTML);
  });
}

describe("Effectif extract (single origin)", () => {
  it("logs in, sets dates/category, exports Excel, and persists artifacts", () => {
    if (!TARGET) throw new Error("TARGET_FRONT_URL or SANDBOX_FRONT_URL must be provided");

    const sY = START.slice(0, 4);
    const sMIdx = Number(START.slice(5, 7)) - 1;
    const sD = START.slice(8, 10).replace(/^0/, "");
    const eY = STOP.slice(0, 4);
    const eMIdx = Number(STOP.slice(5, 7)) - 1;
    const eD = STOP.slice(8, 10).replace(/^0/, "");

    // Login
    cy.visit(`${TARGET}/connexion`);
    cy.get("body", { timeout: 20000 }).should("be.visible");
    cy.get("form", { timeout: 20000 }).should("contain.text", "Vous avez déjà un compte");
    cy.get("h3").should("contain.text", "Se connecter avec son compte");
    cy.get('input[type=email]').clear().type(user.email);
    cy.get('input[type=password]').clear().type(user.password);
    cy.get("form").first().submit();
    cy.location("pathname", { timeout: 20000 }).should("include", "/panorama");
    cy.wait(1000);
    snapshot("step1-done");

    // Dashboard + select backup
    cy.visit(`${TARGET}/dashboard`);
    cy.wait(1000);
    snapshot("step2-done");
    cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should('exist');
    cy.contains('h6, [data-cy="backup-name"]', new RegExp(`^${BACKUP_LABEL}$`, 'i'), { timeout: 20000 })
      .scrollIntoView()
      .click({ force: true });

    // Effectif section
    cy.get('aj-extractor-ventilation', { timeout: 20000 }).first().as('eff');

    // Start date
    cy.get('@eff').find('aj-date-select:nth-of-type(1) > div > p', { timeout: 15000 }).click({ force: true });
    cy.get('mat-datepicker-content .mat-calendar, .cdk-overlay-pane .mat-calendar', { timeout: 15000 }).should('be.visible');
    cy.get('button.mat-calendar-period-button', { timeout: 15000 }).click({ force: true });
    cy.wait(1000);
    snapshot('step4-done');
    cy.contains('.mat-calendar-body .mat-calendar-body-cell-content', sY, { timeout: 15000 }).click({ force: true });
    cy.wait(1000);
    snapshot('step5-done');
    cy.contains(
      'mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content',
      FR_MONTHS[sMIdx],
      { timeout: 15000 }
    ).click({ force: true });
    cy.wait(1000);
    snapshot('step6-done');
    cy.contains('mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content', sD, { timeout: 15000 })
      .click({ force: true });
    cy.wait(1000);
    snapshot('step7-done');

    // End date
    cy.get('@eff').find('aj-date-select:nth-of-type(2) > div > p', { timeout: 15000 }).click({ force: true });
    cy.get('mat-datepicker-content .mat-calendar, .cdk-overlay-pane .mat-calendar', { timeout: 15000 }).should('be.visible');
    cy.get('button.mat-calendar-period-button', { timeout: 15000 }).click({ force: true });
    cy.wait(1000);
    snapshot('step9-done');
    cy.contains('.mat-calendar-body .mat-calendar-body-cell-content', eY, { timeout: 15000 }).click({ force: true });
    cy.wait(1000);
    snapshot('step10-done');
    cy.contains(
      'mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content',
      FR_MONTHS[eMIdx],
      { timeout: 15000 }
    ).click({ force: true });
    cy.wait(1000);
    snapshot('step11-done');
    cy.contains('mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content', eD, { timeout: 15000 })
      .click({ force: true });
    cy.wait(1000);
    snapshot('step12-done');

    // Category: Siège
    cy.get('@eff').find('aj-select > div > p', { timeout: 15000 }).scrollIntoView().click({ force: true });
    cy.wait(500);
    snapshot('step13-category-opened');
    cy.contains('.cdk-overlay-pane mat-option .mat-option-text, .cdk-overlay-pane mat-option', /^Si[eè]ge$/i, { timeout: 15000 }).click({ force: true });
    cy.wait(1000);
    snapshot('step14-category-picked');
    cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
    cy.wait(500);
    snapshot('step15-category-closed');

    // Prepare downloads and Export
    cy.task('wipeDownloads');
    cy.wait(250);
    snapshot('step15b-downloads-wiped');
    cy.get('body').then(($body) => {
      if ($body.find('#export-excel-button').length) {
        cy.get('#export-excel-button').scrollIntoView().click({ force: true });
      } else {
        cy.get('aj-extractor-ventilation > div.exportateur-container > div > p', { timeout: 15000 })
          .scrollIntoView()
          .click({ force: true });
      }
    });
    cy.wait(1000);
    snapshot('step16-export-clicked');

    // Modal Ok
    const modalContainerSel = 'aj-alert, aj-popup, .cdk-overlay-pane .mat-mdc-dialog-container, .cdk-overlay-pane mat-dialog-container, .cdk-overlay-pane [role=dialog], .cdk-overlay-pane aj-popup';
    const modalButtonsSel = 'aj-alert button, aj-popup button, .cdk-overlay-pane [role=dialog] button, .cdk-overlay-pane .mat-mdc-dialog-container button, .cdk-overlay-pane mat-dialog-container button, .cdk-overlay-pane button';
    cy.get(modalContainerSel, { timeout: 15000 }).should('be.visible');
    snapshot('step17-modal-visible');
    cy.get(modalButtonsSel, { timeout: 15000 }).then(($btns) => {
      const arr = Array.from($btns as any);
      const okBtn = (arr as any[]).find((b: any) => /ok/i.test(((b as any).textContent || '').trim()));
      if (okBtn) cy.wrap(okBtn).click({ force: true });
      else if ($btns.length) cy.wrap($btns[0]).click({ force: true });
      else cy.get('div.cdk-overlay-backdrop').click({ force: true });
    });
    cy.wait(1000);
    snapshot('step17-ok-clicked');

    // Persist artifacts
    cy.task('waitForDownloadedExcel', { timeoutMs: 180000 }).then((fileName: string) => {
      const host = new URL(TARGET).host.replace(/[:.]/g, '-');
      const targetBase = `effectif_${host}_${START}_${STOP}_Siege`;
      snapshot('step18-download-detected');
      cy.task('moveAndNormalizeXlsx', { fileName, targetBase }).then(() => {
        snapshot('step19-artifacts-written');
      });
    });
  });
});
