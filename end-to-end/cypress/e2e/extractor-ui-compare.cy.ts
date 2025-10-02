/// <reference types="cypress" />

// UI-driven comparison of extractor outputs between SANDBOX and PR stacks.
// Required env:
// - SANDBOX_FRONT_URL, CANDIDATE_FRONT_URL
// Notes:
// - Backup labels and date ranges are defined explicitly in this test (see BACKUP_LABELS and DATE_RANGES).

import user from "../../fixtures/user.json";

const EFFECTIF_SECTION_MARKER = "données d'effectifs"; // section text
const ACTIVITIES_SECTION_MARKER = "données d'activité";

function selectSidebarExtractors() {
  // Click "Outils" then "Les extracteurs"
  cy.contains('div.menu-item.tools a', /^Outils$/i, { timeout: 10000 }).click();
  cy.contains('a[href="/dashboard"]', /^Les extracteurs$/i, { timeout: 10000 }).click();
}

function selectBackup(label: string) {
  // In the dashboard header/selector area, select the TJ by its visible label in an <h6>
  // We first ensure the list is visible then click the matching tile/card.
  cy.contains('h6', label, { matchCase: false, timeout: 20000 }).scrollIntoView().click({ force: true });
}

function openDatepicker(input: Cypress.Chainable<JQuery<HTMLElement>>) {
  input.scrollIntoView().click({ force: true });
  // Wait for datepicker content
  cy.get('.mat-datepicker-content, .cdk-overlay-container', { timeout: 10000 }).should('be.visible');
}

function pickYear(targetYear: number) {
  // Open multi-year view
  cy.get('button.mat-calendar-period-button', { timeout: 10000 }).click({ force: true });
  // Navigate until the year is visible
  function trySelectYear(retry = 0) {
    cy.get('.mat-calendar-body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.includes(String(targetYear))) {
        cy.contains('.mat-calendar-body .mat-calendar-body-cell-content', String(targetYear), { matchCase: false }).click({ force: true });
      } else if (retry < 6) {
        cy.get('button.mat-calendar-previous-button').click({ force: true });
        trySelectYear(retry + 1);
      } else {
        throw new Error(`Year ${targetYear} not visible in datepicker`);
      }
    });
  }
  trySelectYear();
}

function pickMonth(targetMonthIndex1To12: number) {
  // After selecting year, select month by index (1-12). Cells are ordered Jan..Dec
  const idx0 = targetMonthIndex1To12 - 1;
  cy.get('.mat-calendar-body .mat-calendar-body-cell').eq(idx0).click({ force: true });
}

function pickDay(targetDay: number) {
  cy.contains('.mat-calendar-body .mat-calendar-body-cell-content', String(targetDay)).click({ force: true });
}

function setDatesInSection(sectionRoot: Cypress.Chainable<JQuery<HTMLElement>>, startISO: string, stopISO: string, useMonthPicker = false) {
  const inputs = sectionRoot.find('aj-date-select .mat-datepicker-input');
  // Start
  openDatepicker(cy.wrap(inputs.eq(0)));
  const sY = Number(startISO.slice(0, 4));
  const sM = Number(startISO.slice(5, 7));
  const sD = useMonthPicker ? 1 : Number(startISO.slice(8, 10));
  pickYear(sY);
  pickMonth(sM);
  if (!useMonthPicker) pickDay(sD);

  // Stop
  openDatepicker(cy.wrap(inputs.eq(1)));
  const eY = Number(stopISO.slice(0, 4));
  const eM = Number(stopISO.slice(5, 7));
  const eD = useMonthPicker ? 1 : Number(stopISO.slice(8, 10));
  pickYear(eY);
  pickMonth(eM);
  if (!useMonthPicker) pickDay(eD);
}

function pickCategoryInSection(sectionRoot: Cypress.Chainable<JQuery<HTMLElement>>, categoryLabel: string) {
  // Open dropdown labeled "Sélectionner la catégorie" then click the option.
  sectionRoot.contains(/Sélectionner la catégorie/i, { timeout: 10000 }).click({ force: true });
  // Select by exact/visible text; be lenient on accents/case.
  cy.contains('mat-option, [role="option"], .mat-select-panel .mat-option-text', new RegExp(`^${categoryLabel}$`, 'i'), { timeout: 10000 })
    .click({ force: true });
}

function triggerExportInSection(sectionRoot: Cypress.Chainable<JQuery<HTMLElement>>) {
  // Each block has an element with id="export-excel-button"; scope to the section to avoid clashes.
  sectionRoot.find('#export-excel-button').first().click({ force: true });
}

function interceptSentry() {
  let envelopeCount = 0;
  cy.intercept('POST', '**/envelope/**', (req) => {
    envelopeCount += 1;
    req.reply(200);
  });
  return () => cy.wrap(null).then(() => envelopeCount);
}

function runExtractorFlowForEnv(baseUrl: string, startDate: string, stopDate: string, backupLabel: string) {
  // Visit and login on the specific origin
  const origin = new URL(baseUrl).origin;
  // Setup intercepts outside cy.origin (required by Cypress)
  const effAlias = 'eff-start-filter';
  const actAlias = 'act-filter-list';
  cy.intercept('POST', `${origin}/api/extractor/start-filter-list`).as(effAlias);
  cy.intercept('POST', `${origin}/api/extractor/filter-list-act`).as(actAlias);
  cy.origin(
    origin,
    { args: { baseUrl, startDate, stopDate, backupLabel, user, EFFECTIF_SECTION_MARKER, ACTIVITIES_SECTION_MARKER } },
    ({ baseUrl, startDate, stopDate, backupLabel, user, EFFECTIF_SECTION_MARKER, ACTIVITIES_SECTION_MARKER }) => {
    // Visit login page and authenticate (custom commands are not available inside cy.origin)
    cy.visit(`${baseUrl}/connexion`);
    cy.get("input[type=email]").type(user.email);
    cy.get("input[type=password]").type(user.password);
    cy.get(".password-line").get("#printPassword").click();
    cy.get("form").submit();
    cy.wait(20000);

    // --- Local helpers (must be defined inside cy.origin) ---
    const selectSidebarExtractors = () => {
      cy.contains('div.menu-item.tools a', /^Outils$/i, { timeout: 10000 }).click();
      cy.contains('a[href="/dashboard"]', /^Les extracteurs$/i, { timeout: 10000 }).click();
    };

    const selectBackup = (label: string) => {
      // Log current URL and list of visible TJ labels to help debugging
      cy.location('href').then((href) => cy.log(`Current URL: ${href}`));
      cy.get('h6', { timeout: 20000 }).then(($els) => {
        const labels = Array.from($els as unknown as HTMLElement[])
          .map((el) => (el.textContent || '').trim())
          .filter(Boolean);

        // Persist labels to artifacts for CI debugging
        const host = new URL(baseUrl).host.replace(/[^a-z0-9\.-]/gi, '_');
        // Send to node via task (logged in CI) and also write a file as fallback
        cy.task('saveLabels', { host, labels }, { log: true }).catch(() => null);
        cy.writeFile(`cypress/reports/tj-labels-${host}.json`, labels, { log: true });

        const idx = labels.findIndex((t) => t.toLowerCase() === String(label).toLowerCase());
        if (idx === -1) {
          throw new Error(`Backup label not found: "${label}". Available: ${labels.join(' | ')}`);
        }

        // Click by index to avoid cy.contains timeout masking our debug info
        cy.wrap($els.eq(idx)).scrollIntoView().click({ force: true });
      });
    };

    const openDatepicker = (input: Cypress.Chainable<JQuery<HTMLElement>>) => {
      input.scrollIntoView().click({ force: true });
      cy.get('.mat-datepicker-content, .cdk-overlay-container', { timeout: 10000 }).should('be.visible');
    };

    const pickYear = (targetYear: number) => {
      cy.get('button.mat-calendar-period-button', { timeout: 10000 }).click({ force: true });
      const trySelectYear = (retry = 0) => {
        cy.get('.mat-calendar-body').then(($body) => {
          const bodyText = $body.text();
          if (bodyText.includes(String(targetYear))) {
            cy.contains('.mat-calendar-body .mat-calendar-body-cell-content', String(targetYear), { matchCase: false }).click({ force: true });
          } else if (retry < 6) {
            cy.get('button.mat-calendar-previous-button').click({ force: true });
            trySelectYear(retry + 1);
          } else {
            throw new Error(`Year ${targetYear} not visible in datepicker`);
          }
        });
      };
      trySelectYear();
    };

    const pickMonth = (targetMonthIndex1To12: number) => {
      const idx0 = targetMonthIndex1To12 - 1;
      cy.get('.mat-calendar-body .mat-calendar-body-cell').eq(idx0).click({ force: true });
    };

    const pickDay = (targetDay: number) => {
      cy.contains('.mat-calendar-body .mat-calendar-body-cell-content', String(targetDay)).click({ force: true });
    };

    const setDatesInSection = (sectionRoot: Cypress.Chainable<JQuery<HTMLElement>>, startISO: string, stopISO: string, useMonthPicker = false) => {
      const inputs = sectionRoot.find('aj-date-select .mat-datepicker-input');
      openDatepicker(cy.wrap(inputs.eq(0)));
      const sY = Number(startISO.slice(0, 4));
      const sM = Number(startISO.slice(5, 7));
      const sD = useMonthPicker ? 1 : Number(startISO.slice(8, 10));
      pickYear(sY);
      pickMonth(sM);
      if (!useMonthPicker) pickDay(sD);

      openDatepicker(cy.wrap(inputs.eq(1)));
      const eY = Number(stopISO.slice(0, 4));
      const eM = Number(stopISO.slice(5, 7));
      const eD = useMonthPicker ? 1 : Number(stopISO.slice(8, 10));
      pickYear(eY);
      pickMonth(eM);
      if (!useMonthPicker) pickDay(eD);
    };

    const pickCategoryInSection = (sectionRoot: Cypress.Chainable<JQuery<HTMLElement>>, categoryLabel: string) => {
      sectionRoot.contains(/Sélectionner la catégorie/i, { timeout: 10000 }).click({ force: true });
      cy.contains('mat-option, [role="option"], .mat-select-panel .mat-option-text', new RegExp(`^${categoryLabel}$`, 'i'), { timeout: 10000 })
        .click({ force: true });
    };

    const triggerExportInSection = (sectionRoot: Cypress.Chainable<JQuery<HTMLElement>>) => {
      sectionRoot.find('#export-excel-button').first().click({ force: true });
    };

    // Navigate to extractor UI
    selectSidebarExtractors();

    // Ensure we select the correct TJ (e.g., TJ Lyon)
    selectBackup(backupLabel);

    // Intercepts are defined outside cy.origin; we only wait on them here

    // -------- Effectif extractor block --------
    const effMarker = EFFECTIF_SECTION_MARKER;
    cy.contains(new RegExp(effMarker, 'i'), { timeout: 20000 })
      .parentsUntil('body')
      .filter((_, el) => /données d['’]effectifs/i.test(el.textContent || ''))
      .first()
      .then(($section) => {
        const section = cy.wrap($section as unknown as JQuery<HTMLElement>);
        setDatesInSection(section, startDate, stopDate, false);

        // Three categories to iterate
        const cats = ['Siège', "Équipe autour du magistrat", 'Greffe'];
        const results: Record<string, any> = {};

        cy.wrap(cats).each((cat) => {
          pickCategoryInSection(section, String(cat));
          triggerExportInSection(section);
          cy.wait('@eff-start-filter', { timeout: 180000 }).then(({ response }) => {
            results[String(cat)] = response?.body || null;
          });
        }).then(() => {
          // store in local alias for this environment
          cy.wrap(results).as('effResults');
        });
      });

    // -------- Activities extractor block --------
    const actMarker = ACTIVITIES_SECTION_MARKER;
    cy.contains(new RegExp(actMarker, 'i'), { timeout: 20000 })
      .parentsUntil('body')
      .filter((_, el) => /données d['’]activité/i.test(el.textContent || ''))
      .first()
      .then(($section) => {
        const section = cy.wrap($section as unknown as JQuery<HTMLElement>);
        // Month pickers still accept YYYY-MM string in the input
        const startMonth = startDate.slice(0, 7); // YYYY-MM
        const stopMonth = stopDate.slice(0, 7);
        setDatesInSection(section, startMonth, stopMonth, true);

        triggerExportInSection(section);
        cy.wait('@act-filter-list', { timeout: 180000 }).then(({ response }) => {
          cy.wrap(response?.body || null).as('actResult');
        });
      });

    // Optionally: could assert for network activity outside of origin
  });
}

function deepEqualOrDiff(a: any, b: any) {
  const stringify = (x: any) => JSON.stringify(x, Object.keys(x).sort(), 2);
  const sa = stringify(a);
  const sb = stringify(b);
  if (sa !== sb) {
    // Fail with a readable diff approximation
    throw new Error(`Extractor outputs differ:\n--- A (SANDBOX) ---\n${sa}\n--- B (PR) ---\n${sb}`);
  }
}

// Explicit parameters to cover multiple backups and date ranges
const BACKUP_LABELS: string[] = [
  // TODO: Replace with the three exact labels you want to validate (examples below)
  'TJ Lyon',
  'TJ Marseille',
  'TJ Bordeaux',
];

const DATE_RANGES: Array<{ start: string; stop: string }> = [
  // YYYY-MM-DD format; add/remove as needed
  { start: '2022-01-01', stop: '2022-12-31' },
  { start: '2023-01-01', stop: '2023-12-31' },
  { start: '2024-01-01', stop: '2024-12-31' },
];

describe.only('UI Compare Extractors between SANDBOX and PR', () => {
  it('compares effectif and activities outputs across environments', () => {
    const sandbox = Cypress.env('SANDBOX_FRONT_URL');
    const candidate = Cypress.env('CANDIDATE_FRONT_URL');

    if (!sandbox || !candidate) {
      throw new Error('SANDBOX_FRONT_URL and CANDIDATE_FRONT_URL must be provided');
    }

    // Iterate over backups and date ranges
    cy.wrap(BACKUP_LABELS).each((backupLabel) => {
      cy.wrap(DATE_RANGES).each((range) => {
        const { start, stop } = range as { start: string; stop: string };

        // Run SANDBOX flow
        runExtractorFlowForEnv(String(sandbox), start, stop, String(backupLabel));

        // Capture results from SANDBOX
        cy.get('@effResults').then((effSandbox: any) => {
          cy.get('@actResult').then((actSandbox: any) => {
            // Run PR flow
            runExtractorFlowForEnv(String(candidate), start, stop, String(backupLabel));

            // Compare with PR results
            cy.get('@effResults').then((effCandidate: any) => {
              cy.get('@actResult').then((actCandidate: any) => {
                // Effectif: compare per category payloads (e.g., expect same onglet2)
                const cats = Object.keys(effSandbox || {});
                cats.forEach((c) => {
                  deepEqualOrDiff(effSandbox[c], effCandidate[c]);
                });

                // Activities: compare overall payloads
                deepEqualOrDiff(actSandbox, actCandidate);
              });
            });
          });
        });
      });
    });
  });
});
