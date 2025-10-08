/// <reference types="cypress" />

import user from "../../fixtures/user.json";

// Suite: Effectif exports for PR and SANDBOX across categories, then compare.
// Env needed:
// - SANDBOX_FRONT_URL
// - CANDIDATE_FRONT_URL
// Optional:
// - BACKUP_LABEL (default: test010)
// - START (default: 2023-01-01)
// - STOP (default: 2024-06-15)
// Recommendation: run with CYPRESS_DISABLE_SNAPSHOT_AFTER_EACH=1 to avoid global afterEach snapshots.

const START = String(Cypress.env("START") || "2023-01-01");
const STOP = String(Cypress.env("STOP") || "2024-06-15");
const BACKUP_LABEL = String(Cypress.env("BACKUP_LABEL") || "test010");
const SANDBOX = String(Cypress.env("SANDBOX_FRONT_URL") || "");
const PR = String(Cypress.env("CANDIDATE_FRONT_URL") || "");

const CATEGORIES: string[] = [
  "Tous",
  "Siège",
  "Equipe autour du magistrat",
  "Greffe",
];

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

function snapshot(prefix: string, labelSlug: string, step: string) {
  cy.document().then((doc) => {
    cy.writeFile(`cypress/reports/${prefix}-${labelSlug}-${step}.html`, doc.documentElement.outerHTML);
  });
}

function slugifyLabel(lbl: string): string {
  return lbl
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function categoryPattern(lbl: string): RegExp {
  // Handle accents for provided labels
  if (/^Si(e|è|é)ge$/i.test(lbl) || /^Si[eè]ge$/i.test(lbl)) return /^Si[eè]ge$/i;
  if (/^Equipe autour du magistrat$/i.test(lbl)) return /^(É|E)quipe autour du magistrat$/i;
  if (/^Greffe$/i.test(lbl)) return /^Greffe$/i;
  if (/^Tous$/i.test(lbl)) return /^(Tous|Toutes|Toutes\s*(cat[eé]gories?)?)$/i;
  // Fallback: exact case-insensitive
  const esc = lbl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${esc}$`, 'i');
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

function loginAndOpenDashboard(baseUrl: string) {
  cy.clearAllLocalStorage();
  cy.clearCookies();
  // Enable console capture and API intercepts before visiting
  const hostSafe = new URL(baseUrl).host.replace(/[:.]/g, '-');
  cy.enableDebugLogging(`login-${hostSafe}` as any);
  const netLogs: Array<{ method: string; url: string; status?: number }> = [];
  cy.intercept('**/api/**', (req) => {
    req.on('response', (res) => {
      try { netLogs.push({ method: req.method, url: req.url, status: res.statusCode }); } catch {}
    });
  });
  cy.visit(`${baseUrl}/connexion`, { timeout: 60000 });
  cy.get('body', { timeout: 60000 }).should('be.visible');
  cy.url().should('include', '/connexion');
  // Snapshot current login DOM for diagnostics (slow PR may render late)
  cy.document().then((doc) => {
    cy.writeFile(`cypress/reports/login-${hostSafe}.html`, doc.documentElement.outerHTML);
  });
  // Early flush of network + console logs so we capture issues even if login later times out
  cy.then(() => {
    return cy.task('saveDomHtml', { filename: `net-${hostSafe}.json`, html: JSON.stringify(netLogs, null, 2) });
  });
  cy.flushDebugLogs(`login-${hostSafe}`);
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
  // Persist network logs and console logs for diagnostics
  cy.then(() => {
    return cy.task('saveDomHtml', { filename: `net-${hostSafe}.json`, html: JSON.stringify(netLogs, null, 2) });
  });
  cy.flushDebugLogs(`login-${hostSafe}`);
  cy.visit(`${baseUrl}/dashboard`);
  cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should('exist');
  cy.contains('h6, [data-cy="backup-name"]', new RegExp(`^${BACKUP_LABEL}$`, 'i'), { timeout: 20000 })
    .scrollIntoView()
    .click({ force: true });
}

function setDatesEffectif(startISO: string, stopISO: string, prefix: string, labelSlug: string) {
  const sY = startISO.slice(0, 4);
  const sMIdx = Number(startISO.slice(5, 7)) - 1;
  const sD = startISO.slice(8, 10).replace(/^0/, '');
  const eY = stopISO.slice(0, 4);
  const eMIdx = Number(stopISO.slice(5, 7)) - 1;
  const eD = stopISO.slice(8, 10).replace(/^0/, '');

  cy.get('aj-extractor-ventilation', { timeout: 20000 }).first().as('eff');

  // START
  cy.get('@eff').find('aj-date-select:nth-of-type(1) > div > p', { timeout: 15000 }).click({ force: true });
  cy.get('mat-datepicker-content .mat-calendar, .cdk-overlay-pane .mat-calendar', { timeout: 15000 }).should('be.visible');
  cy.get('button.mat-calendar-period-button', { timeout: 15000 }).click({ force: true });
  snapshot(prefix, labelSlug, 'step4-done');
  cy.contains('.mat-calendar-body .mat-calendar-body-cell-content', sY, { timeout: 15000 }).click({ force: true });
  snapshot(prefix, labelSlug, 'step5-done');
  cy.contains('mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content', FR_MONTHS[sMIdx], { timeout: 15000 }).click({ force: true });
  snapshot(prefix, labelSlug, 'step6-done');
  cy.contains('mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content', sD, { timeout: 15000 }).click({ force: true });
  snapshot(prefix, labelSlug, 'step7-done');

  // END
  cy.get('@eff').find('aj-date-select:nth-of-type(2) > div > p', { timeout: 15000 }).click({ force: true });
  cy.get('mat-datepicker-content .mat-calendar, .cdk-overlay-pane .mat-calendar', { timeout: 15000 }).should('be.visible');
  cy.get('button.mat-calendar-period-button', { timeout: 15000 }).click({ force: true });
  snapshot(prefix, labelSlug, 'step9-done');
  cy.contains('.mat-calendar-body .mat-calendar-body-cell-content', eY, { timeout: 15000 }).click({ force: true });
  snapshot(prefix, labelSlug, 'step10-done');
  cy.contains('mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content', FR_MONTHS[eMIdx], { timeout: 15000 }).click({ force: true });
  snapshot(prefix, labelSlug, 'step11-done');
  cy.contains('mat-datepicker-content .mat-calendar .mat-calendar-body .mat-calendar-body-cell-content', eD, { timeout: 15000 }).click({ force: true });
  snapshot(prefix, labelSlug, 'step12-done');
}

function pickCategoryEffectif(categoryLabel: string, prefix: string, labelSlug: string) {
  cy.get('aj-extractor-ventilation', { timeout: 20000 }).first().as('eff');
  // Open the selector: prefer the icon click, fallback to the text container
  cy.get('@eff').then($eff => {
    const hasIcon = $eff.find('aj-select mat-icon').length > 0;
    if (hasIcon) {
      cy.wrap($eff).find('aj-select mat-icon', { timeout: 15000 }).scrollIntoView().click({ force: true });
    } else {
      cy.wrap($eff).find('aj-select > div > p', { timeout: 15000 }).scrollIntoView().click({ force: true });
    }
  });
  snapshot(prefix, labelSlug, 'step13-category-opened');
  const pat = categoryPattern(categoryLabel);
  cy.get('.cdk-overlay-pane', { timeout: 15000 }).last().then(($ov) => {
    // Snapshot overlay DOM for debugging
    const ovHtml = ($ov.get(0) as HTMLElement)?.innerHTML || '';
    cy.task('saveDomHtml', { filename: `${prefix}-${labelSlug}-overlay.html`, html: ovHtml });
    // 0) Siège special-case: recorder shows first option pseudo-checkbox
    if (/^si[eè]ge$/i.test(categoryLabel)) {
      const siegeDirect = $ov.find('#mat-option-0 > mat-pseudo-checkbox');
      if (siegeDirect.length) {
        cy.wrap(siegeDirect[0]).click({ force: true });
        snapshot(prefix, labelSlug, 'step14-category-picked');
        cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
        snapshot(prefix, labelSlug, 'step15-category-closed');
        cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
        return;
      }
    }
    // 1) Try standard mat-option text
    const matNodes = Array.from($ov.find('mat-option .mat-option-text, mat-option')) as HTMLElement[];
    const matOpt = matNodes.find((el) => pat.test((el.textContent || '').trim()));
    if (matOpt) {
      cy.wrap(matOpt).click({ force: true });
      snapshot(prefix, labelSlug, 'step14-category-picked');
      cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
      snapshot(prefix, labelSlug, 'step15-category-closed');
      cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
      return;
    }
    // 2) Special handling for "Tous": checkbox/aria
    if (/^tous$/i.test(categoryLabel)) {
      const aria = $ov.find('[aria-label="Tous"], [aria-label="Toutes"], [aria-label*="Toutes"]');
      if (aria.length) {
        cy.wrap(aria[0]).click({ force: true });
        snapshot(prefix, labelSlug, 'step14-category-picked');
        cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
        snapshot(prefix, labelSlug, 'step15-category-closed');
        cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
        return;
      }
      const idNode = $ov.find('#mat-mdc-checkbox-0-input');
      if (idNode.length) {
        cy.wrap(idNode[0]).click({ force: true });
        snapshot(prefix, labelSlug, 'step14-category-picked');
        cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
        snapshot(prefix, labelSlug, 'step15-category-closed');
        cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
        return;
      }
      // Find visible text node 'Tous' and click closest clickable container
      const allNodes = Array.from($ov.find('*')) as HTMLElement[];
      const textEl = allNodes.find((el) => /^Tous$/i.test((el.textContent || '').trim()));
      if (textEl) {
        const clickable = (textEl.closest && (textEl.closest('label, .mdc-form-field, .mat-mdc-checkbox') as HTMLElement)) || textEl;
        cy.wrap(clickable).click({ force: true });
        snapshot(prefix, labelSlug, 'step14-category-picked');
        cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
        snapshot(prefix, labelSlug, 'step15-category-closed');
        cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
        return;
      }
    }
    // 3) Fallback for non-"Tous": match loosely (allow suffix like counts) and click its pseudo-checkbox
    const optEls = Array.from($ov.find('mat-option')) as HTMLElement[];
    const loose = new RegExp(`^\\s*${categoryLabel
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/Siege/i, 'Si[eè]ge')
    }\\b`, 'i');
    const matchOpt = optEls.find((el) => {
      const t = (el.textContent || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return loose.test(t);
    });
    if (matchOpt) {
      // Direct recorder id path if present
      const direct = $ov.find('#mat-option-0 > mat-pseudo-checkbox');
      if (direct.length) {
        cy.wrap(direct[0]).click({ force: true });
      } else {
        const pchk = (matchOpt.querySelector('mat-pseudo-checkbox') as HTMLElement) || matchOpt;
        cy.wrap(pchk).click({ force: true });
      }
      snapshot(prefix, labelSlug, 'step14-category-picked');
      cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
      snapshot(prefix, labelSlug, 'step15-category-closed');
      cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
      return;
    }
    throw new Error(`Category option not found in overlay: ${categoryLabel}`);
  });
}

function exportAndPersist(baseUrl: string, startISO: string, stopISO: string, categoryLabel: string, prefix: string, labelSlug: string) {
  cy.task('wipeDownloads');
  // Intercepts: data fetch and template fetch for XLSX
  cy.intercept('POST', '**/api/extractor/**').as('effData');
  cy.intercept('GET', '**/assets/*.xlsx*').as('effTpl');
  snapshot(prefix, labelSlug, 'step15b-downloads-wiped');
  cy.get('body').then(($body) => {
    if ($body.find('#export-excel-button').length) {
      cy.get('#export-excel-button').scrollIntoView().click({ force: true });
    } else {
      cy.get('aj-extractor-ventilation > div.exportateur-container > div > p', { timeout: 15000 }).scrollIntoView().click({ force: true });
    }
  });
  snapshot(prefix, labelSlug, 'step16-export-clicked');
  // Wait for backend/template calls as a signal export pipeline ran
  cy.wait(['@effData', '@effTpl'], { timeout: 180000 }).then(() => {
    snapshot(prefix, labelSlug, 'step16b-network-complete');
  });

  const modalContainerSel = 'aj-alert, aj-popup, .cdk-overlay-pane .mat-mdc-dialog-container, .cdk-overlay-pane mat-dialog-container, .cdk-overlay-pane [role=dialog], .cdk-overlay-pane aj-popup';
  const modalButtonsSel = 'aj-alert button, aj-popup button, .cdk-overlay-pane [role=dialog] button, .cdk-overlay-pane .mat-mdc-dialog-container button, .cdk-overlay-pane mat-dialog-container button, .cdk-overlay-pane button';
  cy.get('body', { timeout: 500 }).then(($b) => {
    const has = $b.find(modalContainerSel).length > 0;
    if (has) {
      cy.get(modalContainerSel, { timeout: 15000 }).should('be.visible');
      snapshot(prefix, labelSlug, 'step17-modal-visible');
      cy.get(modalButtonsSel, { timeout: 15000 }).then(($btns) => {
        const arr = Array.from($btns as any);
        const okBtn = (arr as any[]).find((b: any) => /ok/i.test(((b as any).textContent || '').trim()));
        if (okBtn) cy.wrap(okBtn).click({ force: true });
        else if ($btns.length) cy.wrap($btns[0]).click({ force: true });
        else cy.get('div.cdk-overlay-backdrop').click({ force: true });
      });
      snapshot(prefix, labelSlug, 'step17-ok-clicked');
    } else {
      cy.log('export.modal.absent.continuing');
    }
  });
  // In slower environments, the confirmation modal may appear slightly later.
  // Perform a second opportunistic check after a short delay to avoid getting stuck behind an unconfirmed dialog.
  cy.wait(2500);
  cy.document().then((doc) => {
    const $lateModal = Cypress.$(modalContainerSel, doc);
    if ($lateModal && $lateModal.length) {
      snapshot(prefix, labelSlug, 'step17b-modal-visible-late');
      const $buttons = Cypress.$(modalButtonsSel, doc);
      // Prefer an OK-labeled button if present, otherwise click the first available
      const ok = Array.from($buttons).find((b: any) => /ok/i.test(((b as any).textContent || '').trim()));
      if (ok) (ok as HTMLElement).click();
      else if ($buttons.length) ($buttons.get(0) as HTMLElement).click();
      else {
        const $backdrop = Cypress.$('div.cdk-overlay-backdrop', doc);
        if ($backdrop.length) ($backdrop.get(0) as HTMLElement).click();
      }
      snapshot(prefix, labelSlug, 'step17b-ok-clicked-late');
    }
  });
  // Hook Blob/saveAs to capture XLSX buffer as base64 and persist it as a fallback before waiting for downloads
  cy.window({ log: false }).then((win: any) => {
    try {
      // Hook URL.createObjectURL to detect download start
      const origCreate = win.URL && win.URL.createObjectURL;
      if (origCreate && !(win as any).__hookedCreateObjectURL) {
        (win as any).__hookedCreateObjectURL = true;
        win.URL.createObjectURL = function(blob: any) {
          try { (win as any).__downloadStarted = true; } catch {}
          return origCreate.apply(this, arguments as any);
        } as any;
      }
      // Hook Blob to capture base64
      const OrigBlob = (win as any).Blob;
      if (OrigBlob && !(win as any).__blobHooked) {
        (win as any).__blobHooked = true;
        (win as any).Blob = function(parts: any[], opts?: any) {
          const b = new (OrigBlob as any)(parts, opts);
          try {
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
      const origSaveAs = (win as any).saveAs || ((win as any).FileSaver && (win as any).FileSaver.saveAs);
      if (origSaveAs) {
        (win as any).__origSaveAs = origSaveAs;
        const wrapper = function(blob: any, name: string) {
          try { (win as any).__downloadStarted = true; (win as any).__lastDownloadName = String(name || ''); } catch {}
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
  // Proactively persist from base64 if present to aid download detection
  cy.window({ log: false }).then((win: any) => {
    try {
      const b64 = String((win && win.__lastDownloadBase64) || '');
      const nm = String((win && win.__lastDownloadName) || '');
      if (b64 && b64.length > 100) {
        cy.task('writeBufferToDownloads', { base64: b64, fileName: nm || `effectif_${START}_${STOP}.xlsx` }, { timeout: 200000 });
      }
    } catch {}
  });

  // Extend Cypress command timeout for the task to accommodate slower PR exports
  cy.task('waitForDownloadedExcel', { timeoutMs: 300000 }, { timeout: 320000 }).then((fileName: string) => {
    const host = new URL(baseUrl).host.replace(/[:.]/g, '-');
    const targetBase = `effectif_${host}_${START}_${STOP}_${slugifyLabel(categoryLabel)}`;
    snapshot(prefix, labelSlug, 'step18-download-detected');
    return cy.task('moveAndNormalizeXlsx', { fileName, targetBase }).then(() => {
      snapshot(prefix, labelSlug, 'step19-artifacts-written');
    });
  });
}

describe('Effectif Suite: PR and SANDBOX then compare', () => {
  it('PR: exports for all categories', () => {
    if (!PR) throw new Error('CANDIDATE_FRONT_URL must be provided');
    loginAndOpenDashboard(PR);
    CATEGORIES.forEach((cat, idx) => {
      const labelSlug = slugifyLabel(cat);
      const prefix = 'pr';
      // Refresh/reset page between categories to avoid sticky selection state
      cy.visit(`${PR}/dashboard`);
      cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should('exist');
      cy.contains('h6, [data-cy="backup-name"]', new RegExp(`^${BACKUP_LABEL}$`, 'i'), { timeout: 20000 })
        .scrollIntoView()
        .click({ force: true });
      setDatesEffectif(START, STOP, prefix, labelSlug);
      pickCategoryEffectif(cat, prefix, labelSlug);
      exportAndPersist(PR, START, STOP, cat, prefix, labelSlug);
    });
  });

  it('SANDBOX: exports for all categories', () => {
    if (!SANDBOX) throw new Error('SANDBOX_FRONT_URL must be provided');
    loginAndOpenDashboard(SANDBOX);
    CATEGORIES.forEach((cat, idx) => {
      const labelSlug = slugifyLabel(cat);
      const prefix = 'sandbox';
      // Refresh/reset page between categories to avoid sticky selection state
      cy.visit(`${SANDBOX}/dashboard`);
      cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should('exist');
      cy.contains('h6, [data-cy="backup-name"]', new RegExp(`^${BACKUP_LABEL}$`, 'i'), { timeout: 20000 })
        .scrollIntoView()
        .click({ force: true });
      setDatesEffectif(START, STOP, prefix, labelSlug);
      pickCategoryEffectif(cat, prefix, labelSlug);
      exportAndPersist(SANDBOX, START, STOP, cat, prefix, labelSlug);
    });
  });

  it('Compare PR vs SANDBOX artifacts', () => {
    const hostSB = new URL(SANDBOX).host.replace(/[:.]/g, '-');
    const hostPR = new URL(PR).host.replace(/[:.]/g, '-');

    const results: Array<{ label: string; diffs: string[] }> = [];

    CATEGORIES.forEach((cat) => {
      const slug = slugifyLabel(cat);
      const sbJson = `cypress/artifacts/effectif/effectif_${hostSB}_${START}_${STOP}_${slug}.json`;
      const prJson = `cypress/artifacts/effectif/effectif_${hostPR}_${START}_${STOP}_${slug}.json`;
      cy.readFile(sbJson, { timeout: 60000 }).then((sb) => {
        cy.readFile(prJson, { timeout: 60000 }).then((pr) => {
          const diffs = diffSheetsWithTolerance(sb, pr, 1e-6);
          if (diffs.length) {
            cy.writeFile(`cypress/artifacts/effectif/diff_${slug}.txt`, diffs.join('\n'));
          }
          results.push({ label: cat, diffs });
        });
      });
    });

    cy.then(() => {
      const failing = results.filter(r => r.diffs.length > 0);
      if (failing.length) {
        const summary = failing.map(r => `${r.label}: ${r.diffs.length} mismatches`).join('\n');
        throw new Error(`Effectif comparison mismatches:\n${summary}\nSee cypress/artifacts/effectif/diff_*.txt for details`);
      }
    });
  });
});
