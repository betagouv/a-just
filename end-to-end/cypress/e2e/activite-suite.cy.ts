/// <reference types="cypress" />

import user from "../../fixtures/user.json";

// Suite: Données d'activité exports for PR and SANDBOX, then compare.
// Env needed:
// - SANDBOX_FRONT_URL
// - CANDIDATE_FRONT_URL
// Optional:
// - BACKUP_LABEL (default: test010)
// Dates are defined as in-file constants below for determinism across environments.
// Recommendation: run with CYPRESS_DISABLE_SNAPSHOT_AFTER_EACH=1 to avoid global afterEach snapshots.

// Fixed test window for Activité
const START = '2023-01-01';
const STOP = '2024-06-01';
const ONLY_PR = !!Cypress.env("ONLY_PR");
const BACKUP_LABEL = String(Cypress.env("BACKUP_LABEL") || "test010");
const SANDBOX = String(Cypress.env("SANDBOX_FRONT_URL") || "");
const PR = String(Cypress.env("CANDIDATE_FRONT_URL") || "");
const KEEP_ARTIFACTS = !!(Cypress.env('KEEP_ARTIFACTS') || Cypress.env('CYPRESS_KEEP_ARTIFACTS'));

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

function snapshot(prefix: string, step: string) {
  // no-op: disable HTML snapshot files in CI
}

function snapshotStep(n: number) {
  // no-op
}

function diffSheetsWithTolerance(a: any, b: any, eps = 1e-6): string[] {
  const diffs: string[] = [];
  const sheetsA = Object.keys((a && a.sheets) || {});
  const sheetsB = Object.keys((b && b.sheets) || {});
  const names = Array.from(new Set([...sheetsA, ...sheetsB]));
  names.forEach((name) => {
    const sa: any[][] = (a && a.sheets && a.sheets[name]) || [];
    const sb: any[][] = (b && b.sheets && b.sheets[name]) || [];
    const maxR = Math.max(sa.length, sb.length);
    for (let r = 0; r < maxR; r++) {
      const ra = sa[r] || [];
      const rb = sb[r] || [];
      const maxC = Math.max(ra.length, rb.length);
      for (let c = 0; c < maxC; c++) {
        const va = ra[c];
        const vb = rb[c];
        const aNum = typeof va === 'number';
        const bNum = typeof vb === 'number';
        if (aNum || bNum) {
          const na = Number(va);
          const nb = Number(vb);
          if (!(Number.isFinite(na) && Number.isFinite(nb) && Math.abs(na - nb) <= eps)) {
            diffs.push(`${name}[${r},${c}]: ${String(va)} !== ${String(vb)}`);
          }
        } else {
          const saStr = (va ?? '').toString().trim();
          const sbStr = (vb ?? '').toString().trim();
          if (saStr !== sbStr) {
            diffs.push(`${name}[${r},${c}]: '${saStr}' !== '${sbStr}'`);
          }
        }
      }
    }
  });
  return diffs;
}

// Poll window.__lastDownloadBase64 and persist to downloads when available.
// This is non-invasive and safeguards CI where the native download path may be flaky or very slow.
function persistBase64WhenReady(defaultFileName: string, maxMs = 240000, intervalMs = 1000) {
  const start = Date.now();
  const loop = (): Cypress.Chainable<any> => {
    return cy.window({ log: false }).then((win: any) => {
      try {
        const b64 = String((win && win.__lastDownloadBase64) || '');
        const nm = String((win && win.__lastDownloadName) || '') || defaultFileName;
        if (b64 && b64.length > 100) {
          return cy
            .task('writeBufferToDownloads', { base64: b64, fileName: nm }, { timeout: 200000 })
            .then(() => undefined);
        }
      } catch {}
      if (Date.now() - start >= maxMs) {
        return cy.wrap(null, { log: false });
      }
      return cy.wait(intervalMs, { log: false }).then(loop);
    });
  };
  return loop();
}

function loginAndOpenDashboard(baseUrl: string) {
  cy.clearAllLocalStorage();
  cy.clearCookies();
  cy.visit(`${baseUrl}/connexion`, { timeout: 60000 });
  cy.get('body', { timeout: 60000 }).should('be.visible');
  cy.url().should('include', '/connexion');
  // Mirror login.cy.js flow exactly
  cy.get('form', { timeout: 60000 }).then(($forms) => {
    if ($forms.length) {
      cy.wrap($forms)
        .should('contain.text', 'Vous avez déjà un compte')
        .get('h3')
        .should('contain.text', 'Se connecter avec son compte')
        .get('input[type=email]')
        .type(user.email)
        .get('input[type=password]')
        .type(user.password)
        .get('form')
        .submit();
    } else {
      // Fallback: SSO button if present
      cy.contains('.sso-bt, button, [role=button]', /Pages Blanches|SSO|Se connecter avec Pages Blanches/i, { timeout: 10000 })
        .click({ force: true });
    }
  });
  cy.location('pathname', { timeout: 60000 }).should('include', '/panorama');
  // proceed to dashboard
  cy.visit(`${baseUrl}/dashboard`);
  cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should('exist');
  cy.contains('h6, [data-cy="backup-name"]', new RegExp(`^${BACKUP_LABEL}$`, 'i'), { timeout: 20000 })
    .scrollIntoView()
    .click({ force: true });
}

function setDatesActivite(startISO: string, stopISO: string, prefix: string) {
  const sY = startISO.slice(0, 4);
  const sMIdx = Number(startISO.slice(5, 7)) - 1;
  const eY = stopISO.slice(0, 4);
  const eMIdx = Number(stopISO.slice(5, 7)) - 1;

  cy.get('aj-extractor-activity', { timeout: 20000 }).first().as('act');

  // START
  cy.get('@act').find('aj-date-select:nth-of-type(1) > div > p', { timeout: 15000 }).click({ force: true });
  cy.get('.cdk-overlay-pane #mat-datepicker-2', { timeout: 15000 }).should('be.visible').as('dpStart');
  snapshotStep(1);
  // Two clicks to reach multi-year view (year selection) exactly like recorder, with fallback to mat-calendar-period-button
  cy.get('@dpStart').then(($dp) => {
    const hasPeriodBtn = $dp.find('button.mat-calendar-period-button').length > 0;
    if (hasPeriodBtn) {
      cy.wrap($dp).find('button.mat-calendar-period-button', { timeout: 15000 }).click({ force: true });
      cy.wrap($dp).find('button.mat-calendar-period-button', { timeout: 15000 }).click({ force: true });
    } else {
      cy.wrap($dp).find('mat-calendar-header', { timeout: 15000 }).within(() => {
        cy.get('button.mdc-button .mat-mdc-button-touch-target', { timeout: 15000 })
          .first()
          .then(($el) => cy.wrap($el).closest('button').click({ force: true }));
        cy.get('span.mdc-button__label > span', { timeout: 15000 })
          .first()
          .then(($el) => cy.wrap($el).closest('button').click({ force: true }));
      });
    }
  });
  snapshotStep(2);
  // Click the year cell (e.g., 2023) by clicking its button directly
  cy.get('@dpStart')
    .find('.mat-calendar-body button', { timeout: 15000 })
    .contains(sY)
    .click({ force: true });
  // Immediately snapshot after year click to debug transitions
  snapshotStep(3);
  // Select JANV. — prefer exact cell path (row 2, col 1) like recorder, fallback to text
  // Prefer exact nth-of-type path to the month button; fallback to text on button
  cy.get('@dpStart')
    .find(
      'mat-year-view table tbody tr:nth-of-type(2) td:nth-of-type(1) button, .mat-year-view .mat-calendar-body table tbody tr:nth-of-type(2) td:nth-of-type(1) button',
      { timeout: 15000 }
    )
    .then(($btns) => {
      if ($btns.length) {
        cy.wrap($btns[0]).click({ force: true });
      } else {
        cy.get('@dpStart')
          .find('.mat-calendar-body button', { timeout: 15000 })
          .contains(FR_MONTHS[sMIdx])
          .click({ force: true });
      }
    });
  snapshotStep(4);

  // END
  cy.get('@act').find('aj-date-select:nth-of-type(2) > div > p', { timeout: 15000 }).click({ force: true });
  cy.get('.cdk-overlay-pane #mat-datepicker-3', { timeout: 15000 }).should('be.visible').as('dpEnd');
  snapshotStep(5);
  cy.get('@dpEnd')
    .find(
      'mat-year-view table tbody tr:nth-of-type(3) td:nth-of-type(2) button, .mat-year-view .mat-calendar-body table tbody tr:nth-of-type(3) td:nth-of-type(2) button',
      { timeout: 15000 }
    )
    .then(($btns) => {
      if ($btns.length) {
        cy.wrap($btns[0]).click({ force: true });
      } else {
        cy.get('@dpEnd')
          .find('.mat-calendar-body button', { timeout: 15000 })
          .contains(FR_MONTHS[eMIdx])
          .click({ force: true });
      }
    });
  snapshotStep(6);
  // Ensure no datepicker overlay remains open (can block clicks)
  cy.get('body').then(($b) => {
    const $ov = $b.find('div.cdk-overlay-backdrop');
    if ($ov.length) cy.wrap($ov.get(0)).click({ force: true });
  });
}

function exportAndPersistActivite(baseUrl: string, startISO: string, stopISO: string, prefix: string) {
  if (!KEEP_ARTIFACTS) cy.task('wipeDownloads');
  snapshot(prefix, 'act-downloads-wiped');
  // Intercepts to ensure data and template are fetched
  cy.intercept('POST', '**/api/extractor/filter-list-act').as('actData');
  // Match template fetch even if a cache-buster query is appended
  cy.intercept('GET', '**/assets/*.xlsx*').as('actTpl');
  // Do not dump exception files in CI
  // Instrument download start and browser alerts for diagnostics
  cy.window({ log: false }).then((win: any) => {
    try {
      (win as any).__downloadStarted = false;
      (win as any).__lastDownloadName = '';
      (win as any).__lastDownloadBase64 = '';
      // Hook fetch to force XLSX requests to bypass cache (no logging)
      try {
        if (!(win as any).__fetchHooked) {
          const origFetch = (win as any).fetch && (win as any).fetch.bind(win);
          if (origFetch) {
            (win as any).__fetchHooked = true;
            (win as any).fetch = function(input: any, init?: any) {
              try {
                let url = typeof input === 'string' ? input : (input && input.url) || '';
                if (/\/assets\/.*\.xlsx(\?.*)?$/i.test(url)) {
                  const u = new URL(url, win.location.origin);
                  u.searchParams.set('e2e', String(Date.now()));
                  input = u.toString();
                }
              } catch {}
              return origFetch(input, init);
            } as any;
          }
        }
      } catch {}
      // Hook URL.createObjectURL which is used by FileSaver to trigger the download
      try {
        const origCreate = win.URL && win.URL.createObjectURL;
        if (origCreate && !(win as any).__hookedCreateObjectURL) {
          (win as any).__hookedCreateObjectURL = true;
          win.URL.createObjectURL = function(blob: any) {
            try { (win as any).__downloadStarted = true; } catch {}
            return origCreate.apply(this, arguments as any);
          } as any;
        }
      } catch {}
      // Hook Blob constructor to capture the XLSX buffer even if saveAs is not hooked
      try {
        const OrigBlob = (win as any).Blob;
        if (OrigBlob && !(win as any).__blobHooked) {
          (win as any).__blobHooked = true;
          (win as any).Blob = function(parts: any[], opts?: any) {
            const b = new (OrigBlob as any)(parts, opts);
            try {
              // Capture any reasonably large blob as a potential excel buffer
              const size = (b && (b as any).size) || 0;
              if (size > 100) {
                const reader = new (win as any).FileReader();
                reader.onloadend = () => {
                  try {
                    const res = String(reader.result || '');
                    const base64 = res.includes(',') ? res.split(',')[1] : res;
                    (win as any).__lastDownloadBase64 = base64;
                  } catch {}
                };
                try { reader.readAsDataURL(b); } catch {}
              }
            } catch {}
            return b;
          } as any;
        }
      } catch {}
      // Hook anchor clicks to detect download initiation even if it bypasses saveAs
      try {
        const proto = (win as any).HTMLAnchorElement && (win as any).HTMLAnchorElement.prototype;
        if (proto && !(win as any).__aClickHooked) {
          (win as any).__aClickHooked = true;
          const origClick = proto.click;
          proto.click = function(this: HTMLAnchorElement) {
            try {
              const nm = (this as any).download || '';
              const href = (this as any).href || '';
              if (nm && /\.xlsx$/i.test(String(nm))) {
                (win as any).__downloadStarted = true;
                (win as any).__lastDownloadName = String(nm);
              }
              if (href && /^blob:/i.test(String(href))) {
                (win as any).__downloadStarted = true;
                if (!(win as any).__lastDownloadName) (win as any).__lastDownloadName = 'blob.xlsx';
              }
            } catch {}
            return origClick.apply(this, arguments as any);
          } as any;
        }
      } catch {}
      const origSaveAs = (win as any).saveAs || ((win as any).FileSaver && (win as any).FileSaver.saveAs);
      if (origSaveAs) {
        (win as any).__origSaveAs = origSaveAs;
        const wrapper = function(blob: any, name: string) {
          try { (win as any).__downloadStarted = true; (win as any).__lastDownloadName = String(name || ''); } catch {}
          // Capture Blob as base64 for fallback persistence from Cypress task
          try {
            const reader = new (win as any).FileReader();
            reader.onloadend = () => {
              try {
                const res = String(reader.result || '');
                const base64 = res.includes(',') ? res.split(',')[1] : res;
                (win as any).__lastDownloadBase64 = base64;
              } catch {}
            };
            reader.readAsDataURL(blob);
          } catch {}
          return origSaveAs.apply(this, arguments as any);
        } as any;
        if ((win as any).saveAs) (win as any).saveAs = wrapper; else if ((win as any).FileSaver) (win as any).FileSaver.saveAs = wrapper;
      }
    } catch {}
  });
  // No window:alert dump
  cy.get('body').then(($body) => {
    // Safety: close any open overlay (datepicker or stale dialog) before pressing export
    const $bd = $body.find('div.cdk-overlay-backdrop');
    if ($bd.length) {
      cy.wrap($bd.get(0)).click({ force: true });
      cy.wait(150);
    }
    if ($body.find('aj-extractor-activity > div.exportateur-container > div > p').length) {
      cy.get('aj-extractor-activity > div.exportateur-container > div > p', { timeout: 15000 })
        .scrollIntoView()
        .click({ force: true });
    } else if ($body.find('#export-excel-button p').length) {
      cy.get('#export-excel-button p').scrollIntoView().click({ force: true });
    } else if ($body.find('#export-excel-button').length) {
      cy.get('#export-excel-button').scrollIntoView().click({ force: true });
    } else {
      cy.contains('button, [role=button], div', /Exporter|Excel|Télécharger/i, { timeout: 15000 })
        .scrollIntoView()
        .click({ force: true });
    }
  });
  snapshot(prefix, 'act-export-clicked');
  // Wait for backend data and template fetch to complete as a signal the export pipeline ran
  cy.wait(['@actData', '@actTpl'], { timeout: 180000 }).then(() => {
    snapshot(prefix, 'act-network-complete');
  });
  // If the front triggered saveAs, we should see the flag flip
  cy.window({ log: false }).its('__downloadStarted', { timeout: 180000 }).should('be.oneOf', [true, false]).then((started) => {
    if (!started) {
      // Log last-known filename (may be empty if saveAs not called)
      cy.window({ log: false }).its('__lastDownloadName').then((nm) => cy.log(`download.name: ${nm}`));
    }
  });

  const modalContainerSel = 'aj-alert, aj-popup, .cdk-overlay-pane .mat-mdc-dialog-container, .cdk-overlay-pane mat-dialog-container, .cdk-overlay-pane [role=dialog], .cdk-overlay-pane aj-popup';
  const modalButtonsSel = 'aj-alert button, aj-popup button, .cdk-overlay-pane [role=dialog] button, .cdk-overlay-pane .mat-mdc-dialog-container button, .cdk-overlay-pane mat-dialog-container button, .cdk-overlay-pane button';
  cy.get('body', { timeout: 500 }).then(($b) => {
    const has = $b.find(modalContainerSel).length > 0;
    if (has) {
      cy.get(modalContainerSel, { timeout: 15000 }).should('be.visible');
      snapshot(prefix, 'act-modal-visible');
      cy.get(modalButtonsSel, { timeout: 15000 }).then(($btns) => {
        const arr = Array.from($btns as any);
        const okBtn = (arr as any[]).find((b: any) => /^ok$/i.test(((b as any).textContent || '').trim()));
        if (okBtn) {
          cy.wrap(okBtn).click({ force: true });
        } else if ($btns.length) {
          cy.wrap($btns[0]).click({ force: true });
        } else {
          cy.get('div.cdk-overlay-backdrop').click({ force: true });
        }
      });
      snapshot(prefix, 'act-modal-ok-clicked');
    } else {
      cy.log('export.modal.absent.continuing');
    }
  });
  // Late-appearing modal safety net
  cy.wait(2500);
  cy.document().then((doc) => {
    const $lateModal = Cypress.$(modalContainerSel, doc);
    if ($lateModal && $lateModal.length) {
      snapshot(prefix, 'act-modal-visible-late');
      const $buttons = Cypress.$(modalButtonsSel, doc);
      const ok = Array.from($buttons).find((b: any) => /ok/i.test(((b as any).textContent || '').trim()));
      if (ok) (ok as HTMLElement).click();
      else if ($buttons.length) ($buttons.get(0) as HTMLElement).click();
      else {
        const $backdrop = Cypress.$('div.cdk-overlay-backdrop', doc);
        if ($backdrop.length) ($backdrop.get(0) as HTMLElement).click();
      }
      snapshot(prefix, 'act-modal-ok-clicked-late');
    }
  });
  // Extra snapshot after handling any modal timing

  // Bounded polling fallback: persist from base64 once available to aid waitForDownloadedExcel
  persistBase64WhenReady(`activite_${START}_${STOP}.xlsx`);

  // Wait longer to accommodate slower export in CI for PR builds
  cy.task('waitForDownloadedExcel', { timeoutMs: 300000 }, { timeout: 320000 }).then((fileName: string) => {
    const host = new URL(baseUrl).host.replace(/[:.]/g, '-');
    const targetBase = `activite_${host}_${START}_${STOP}`;
    snapshot(prefix, 'act-download-detected');
    return cy.task('moveAndNormalizeXlsxTo', { fileName, targetBase, subdir: 'activite' }).then(() => {
      snapshot(prefix, 'act-artifacts-written');
    });
  });
}

describe('Activite Suite: PR and SANDBOX then compare', () => {
  it('PR: export activite', () => {
    if (!PR) throw new Error('CANDIDATE_FRONT_URL must be provided');
    if (!KEEP_ARTIFACTS) cy.task('wipeActiviteArtifacts');
    loginAndOpenDashboard(PR);
    cy.visit(`${PR}/dashboard`);
    cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should('exist');
    cy.contains('h6, [data-cy="backup-name"]', new RegExp(`^${BACKUP_LABEL}$`, 'i'), { timeout: 20000 })
      .scrollIntoView()
      .click({ force: true });
    cy.window({ log: false }).then((win: any) => {
      let ok = false;
      try {
        const host = Cypress.$('aj-extractor-activity').get(0);
        const ng = (win as any).ng;
        if (host && ng && typeof ng.getComponent === 'function') {
          const cmp = ng.getComponent(host);
          if (cmp && typeof cmp.selectDate === 'function') {
            cmp.selectDate('start', new Date(START));
            cmp.selectDate('stop', new Date(STOP));
            ok = true;
          }
        }
      } catch {}
      if (!ok) {
        setDatesActivite(START, STOP, 'pr');
      }
    });
    cy.get('#export-excel-button').should('not.have.class', 'disabled');
    exportAndPersistActivite(PR, START, STOP, 'pr');
  });

  if (ONLY_PR) {
    it.skip('SANDBOX: export activite', () => {});
    it.skip('Compare PR vs SANDBOX activite artifacts', () => {});
  } else {
    it('SANDBOX: export activite', () => {
      if (!SANDBOX) throw new Error('SANDBOX_FRONT_URL must be provided');
      loginAndOpenDashboard(SANDBOX);
      cy.visit(`${SANDBOX}/dashboard`);
      cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should('exist');
      cy.contains('h6, [data-cy="backup-name"]', new RegExp(`^${BACKUP_LABEL}$`, 'i'), { timeout: 20000 })
        .scrollIntoView()
        .click({ force: true });
      cy.window({ log: false }).then((win: any) => {
        let ok = false;
        try {
          const host = Cypress.$('aj-extractor-activity').get(0);
          const ng = (win as any).ng;
          if (host && ng && typeof ng.getComponent === 'function') {
            const cmp = ng.getComponent(host);
            if (cmp && typeof cmp.selectDate === 'function') {
              cmp.selectDate('start', new Date(START));
              cmp.selectDate('stop', new Date(STOP));
              ok = true;
            }
          }
        } catch {}
        if (!ok) {
          setDatesActivite(START, STOP, 'sandbox');
        }
      });
      cy.get('#export-excel-button').should('not.have.class', 'disabled');
      exportAndPersistActivite(SANDBOX, START, STOP, 'sandbox');
    });

    it('Compare PR vs SANDBOX activite artifacts', () => {
      const hostSB = new URL(SANDBOX).host.replace(/[:.]/g, '-');
      const hostPR = new URL(PR).host.replace(/[:.]/g, '-');

      const sbJson = `cypress/artifacts/activite/activite_${hostSB}_${START}_${STOP}.json`;
      const prJson = `cypress/artifacts/activite/activite_${hostPR}_${START}_${STOP}.json`;

      cy.readFile(sbJson, { timeout: 60000 }).then((sb) => {
        cy.readFile(prJson, { timeout: 60000 }).then((pr) => {
          const diffs = diffSheetsWithTolerance(sb, pr, 1e-6);
          if (diffs.length) {
            throw new Error(`Activite comparison mismatches: ${diffs.length} cells differ.`);
          }
        });
      });
    });
  }
});
