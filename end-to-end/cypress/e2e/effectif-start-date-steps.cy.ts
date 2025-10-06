/// <reference types="cypress" />

import user from "../../fixtures/user.json";

// Defaults aligned with the main suites (see activite-suite.cy.ts and effectif-suite.cy.ts)
const BACKUP_LABEL = Cypress.env("BACKUP_LABEL") || "test010";
const START = Cypress.env("START") || "2024-01-01"; // YYYY-MM-DD
const STOP = Cypress.env("STOP") || "2025-06-15"; // not used here yet

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

describe("Effectif start date steps", () => {
  it("performs the 7 steps on SANDBOX using configured parameters", () => {
    const baseUrl: string = String(Cypress.env("SANDBOX_FRONT_URL") || "");
    if (!baseUrl) throw new Error("SANDBOX_FRONT_URL must be provided");

    const sY = START.slice(0, 4);
    const sMIdx = Number(START.slice(5, 7)) - 1; // 0-based
    const sD = START.slice(8, 10).replace(/^0/, "");

    // Step 1: login -> /panorama
    cy.visit(`${baseUrl}/connexion`);
    cy.get("body", { timeout: 20000 }).should("be.visible");
    cy.get("form", { timeout: 20000 }).should("contain.text", "Vous avez déjà un compte");
    cy.get("h3").should("contain.text", "Se connecter avec son compte");
    cy.get('input[type=email]').clear().type(user.email);
    cy.get('input[type=password]').clear().type(user.password);
    cy.get("form").first().submit();
    cy.location("pathname", { timeout: 20000 }).should("include", "/panorama");
    cy.wait(1000);
    snapshot("step1-done");

    // Step 2: go to /dashboard
    cy.visit(`${baseUrl}/dashboard`);
    cy.wait(1000);
    snapshot("step2-done");

    // Ensure target backup is selected
    cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should('exist');
    cy.contains('h6, [data-cy="backup-name"]', new RegExp(`^${BACKUP_LABEL}$`, 'i'), { timeout: 20000 })
      .scrollIntoView()
      .click({ force: true });

    // Step 3: open START datepicker by clicking the "Pour la période du" area
    cy.get('aj-extractor-ventilation aj-date-select:nth-of-type(1) > div > p', { timeout: 15000 })
      .scrollIntoView()
      .click({ force: true });
    cy.wait(1000);
    snapshot("step3-done");

    // Optional guard: overlay visible
    cy.get('mat-datepicker-content .mat-calendar, .cdk-overlay-pane .mat-calendar', { timeout: 15000 })
      .should('be.visible');

    // Step 4: click the period button (top-left) to switch to year selection
    cy.get('button.mat-calendar-period-button', { timeout: 15000 }).click({ force: true });
    cy.wait(1000);
    snapshot("step4-done");

    // Step 5: click the target year (e.g., 2024)
    cy.contains('.mat-calendar-body .mat-calendar-body-cell-content', sY, { timeout: 15000 })
      .click({ force: true });
    cy.wait(1000);
    snapshot("step5-done");

    // Step 6: click the target month (by FR label)
    cy.contains('mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content', FR_MONTHS[sMIdx], { timeout: 15000 })
      .click({ force: true });
    cy.wait(1000);
    snapshot("step6-done");

    // Step 7: click the target day
    cy.contains('mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content', sD, { timeout: 15000 })
      .click({ force: true });
    cy.wait(1000);
    snapshot("step7-done");

    // -------- END date (Effectif) --------
    const eY = STOP.slice(0, 4);
    const eMIdx = Number(STOP.slice(5, 7)) - 1; // 0-based
    const eD = STOP.slice(8, 10).replace(/^0/, "");

    // Step 8: open END datepicker by clicking the "À" area
    cy.get('aj-extractor-ventilation aj-date-select:nth-of-type(2) > div > p', { timeout: 15000 })
      .scrollIntoView()
      .click({ force: true });
    cy.wait(1000);
    snapshot("step8-done");

    // Optional guard: overlay visible
    cy.get('mat-datepicker-content .mat-calendar, .cdk-overlay-pane .mat-calendar', { timeout: 15000 })
      .should('be.visible');

    // Step 9: open year selection
    cy.get('button.mat-calendar-period-button', { timeout: 15000 }).click({ force: true });
    cy.wait(1000);
    snapshot('step9-done');

    // Step 10: pick target year
    cy.contains('.mat-calendar-body .mat-calendar-body-cell-content', eY, { timeout: 15000 })
      .click({ force: true });
    cy.wait(1000);
    snapshot('step10-done');

    // Step 11: pick target month (by FR label)
    cy.contains('mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content', FR_MONTHS[eMIdx], { timeout: 15000 })
      .click({ force: true });
    cy.wait(1000);
    snapshot('step11-done');

    // Step 12: pick target day
    cy.contains('mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content', eD, { timeout: 15000 })
      .click({ force: true });
    cy.wait(1000);
    snapshot('step12-done');
    
    // -------- Category selection (Effectif) --------
    // Step 13: open category selector via aj-select > div > p (Chrome Recorder)
    cy.get('aj-extractor-ventilation', { timeout: 20000 }).first().as('eff');
    cy.get('@eff')
      .find('aj-select > div > p', { timeout: 15000 })
      .scrollIntoView()
      .click({ force: true });
    cy.wait(500);
    snapshot('step13-category-opened');

    // Step 14: pick "Siège" from overlay options (match accent variations)
    cy.contains('.cdk-overlay-pane mat-option .mat-option-text, .cdk-overlay-pane mat-option', /^Si[eè]ge$/i, { timeout: 15000 })
      .click({ force: true });
    cy.wait(1000);
    snapshot('step14-category-picked');

    // Step 15: click backdrop to ensure overlay closes (as per Recorder)
    cy.get('body').then(($body) => {
      const hasBackdrop = $body.find('div.cdk-overlay-backdrop').length > 0;
      if (hasBackdrop) {
        cy.get('div.cdk-overlay-backdrop').click({ force: true });
      }
    });
    cy.wait(500);
    snapshot('step15-category-closed');

    // -------- Excel export (Effectif) --------
    // Pre-step: ensure downloads folder is empty to avoid matching previous files
    cy.task('wipeDownloads');
    cy.wait(250);
    snapshot('step15b-downloads-wiped');
    // Step 16: click on the excel generation button
    cy.get('@eff').then(() => {
      cy.get('body').then(($body) => {
        if ($body.find('#export-excel-button').length) {
          cy.get('#export-excel-button').scrollIntoView().click({ force: true });
        } else {
          cy.get('aj-extractor-ventilation > div.exportateur-container > div > p', { timeout: 15000 })
            .scrollIntoView()
            .click({ force: true });
        }
      });
    });
    cy.wait(1000);
    snapshot('step16-export-clicked');

    // Step 17: click on "Ok" in the information modal (robust across implementations)
    const modalContainerSel = 'aj-alert, aj-popup, .cdk-overlay-pane .mat-mdc-dialog-container, .cdk-overlay-pane mat-dialog-container, .cdk-overlay-pane [role=dialog], .cdk-overlay-pane aj-popup';
    const modalButtonsSel = 'aj-alert button, aj-popup button, .cdk-overlay-pane [role=dialog] button, .cdk-overlay-pane .mat-mdc-dialog-container button, .cdk-overlay-pane mat-dialog-container button, .cdk-overlay-pane button';
    cy.get(modalContainerSel, { timeout: 15000 }).should('be.visible');
    snapshot('step17-modal-visible');
    cy.get(modalButtonsSel, { timeout: 15000 }).then(($btns) => {
      const arr = Array.from($btns as any as HTMLElement[]);
      const okBtn = arr.find((b) => /ok/i.test((b.textContent || '').trim()));
      if (okBtn) {
        cy.wrap(okBtn).click({ force: true });
      } else if ($btns.length) {
        cy.wrap($btns[0]).click({ force: true });
      } else {
        // As a last resort, click the overlay backdrop to close
        cy.get('div.cdk-overlay-backdrop').click({ force: true });
      }
    });
    cy.wait(1000);
    snapshot('step17-ok-clicked');

    // Step 18: wait for the Excel file to appear in downloads, then move and normalize it
    cy.task('waitForDownloadedExcel', { timeoutMs: 180000 }).then((fileName: string) => {
      cy.log(`downloaded file: ${fileName}`);
      const host = new URL(String(Cypress.env('SANDBOX_FRONT_URL') || '')).host.replace(/[:.]/g, '-');
      const targetBase = `effectif_${host}_${START}_${STOP}_Siege`;
      snapshot('step18-download-detected');
      cy.task('moveAndNormalizeXlsx', { fileName, targetBase }).then((paths: any) => {
        cy.log(`artifacts: ${JSON.stringify(paths)}`);
        snapshot('step19-artifacts-written');
      });
    });
  });
});
