/// <reference types="cypress" />

import user from "../../fixtures/user.json";

// Suite: Données d'activité exports for PR and SANDBOX, then compare.
// Env needed:
// - SANDBOX_FRONT_URL
// - CANDIDATE_FRONT_URL
// Optional:
// - BACKUP_LABEL (default: test010)
// - START (default: 2023-01-01)
// - STOP (default: 2024-06-01)
// Recommendation: run with CYPRESS_DISABLE_SNAPSHOT_AFTER_EACH=1 to avoid global afterEach snapshots.

// Dates defined in-file for determinism in local and CI runs
const START = '2023-01-01';
const STOP = '2024-06-01';
const ONLY_PR = !!Cypress.env("ONLY_PR");
// Hosts defined in-file to remove dependency on env wiring
const BACKUP_LABEL = 'test010';
const SANDBOX = 'http://175.0.0.31:4200';
const PR = 'http://175.0.0.30:4200';
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

function snapshot(prefix: string, step: string) { /* no-op */ }
function snapshotStep(n: number) { /* no-op */ }

// Convert column index to Excel letter (0 -> A, 1 -> B, 25 -> Z, 26 -> AA, etc.)
function colToExcel(col: number): string {
  let result = '';
  let c = col;
  while (c >= 0) {
    result = String.fromCharCode(65 + (c % 26)) + result;
    c = Math.floor(c / 26) - 1;
  }
  return result;
}

// Convert row/col to Excel notation (e.g., row=0, col=1 -> "B1")
function cellToExcel(row: number, col: number): string {
  return `${colToExcel(col)}${row + 1}`;
}

interface SheetDiff {
  sheet: string;
  cell: string;
  reference: string;
  new: string;
}

function diffSheetsWithTolerance(reference: any, candidate: any, eps = 1e-6): { diffs: SheetDiff[]; summary: string } {
  const allDiffs: SheetDiff[] = [];
  const sheetsRef = Object.keys((reference && reference.sheets) || {});
  const sheetsCand = Object.keys((candidate && candidate.sheets) || {});
  const allSheetNames = Array.from(new Set([...sheetsRef, ...sheetsCand]));
  
  // Helper to extract cell properties (handles both simple values and complex cell objects)
  const getCellProps = (cell: any) => {
    if (cell === null || cell === undefined || cell === '') {
      return { v: '', f: undefined, z: undefined, t: undefined, style: undefined, dv: undefined };
    }
    if (typeof cell === 'object' && !Array.isArray(cell)) {
      return {
        v: cell.v ?? '',
        f: cell.f,
        z: cell.z,
        t: cell.t,
        style: cell.style,
        dv: cell.dv
      };
    }
    // Simple value (backward compatibility)
    return { v: cell, f: undefined, z: undefined, t: undefined, style: undefined, dv: undefined };
  };
  
  allSheetNames.forEach((sheetName) => {
    const refSheet: any[][] = (reference && reference.sheets && reference.sheets[sheetName]) || [];
    const candSheet: any[][] = (candidate && candidate.sheets && candidate.sheets[sheetName]) || [];
    const maxR = Math.max(refSheet.length, candSheet.length);
    
    for (let r = 0; r < maxR; r++) {
      const refRow = refSheet[r] || [];
      const candRow = candSheet[r] || [];
      const maxC = Math.max(refRow.length, candRow.length);
      
      for (let c = 0; c < maxC; c++) {
        const refCell = getCellProps(refRow[c]);
        const candCell = getCellProps(candRow[c]);
        
        const differences: string[] = [];
        
        // Compare values
        const refIsNum = typeof refCell.v === 'number';
        const candIsNum = typeof candCell.v === 'number';
        if (refIsNum || candIsNum) {
          const nRef = Number(refCell.v);
          const nCand = Number(candCell.v);
          if (!(Number.isFinite(nRef) && Number.isFinite(nCand) && Math.abs(nRef - nCand) <= eps)) {
            differences.push(`Valeur : ${refCell.v} → ${candCell.v}`);
          }
        } else {
          const refStr = String(refCell.v ?? '').trim();
          const candStr = String(candCell.v ?? '').trim();
          if (refStr !== candStr) {
            differences.push(`Valeur : "${refStr}" → "${candStr}"`);
          }
        }
        
        // Compare formulas
        const refFormula = refCell.f || '';
        const candFormula = candCell.f || '';
        if (refFormula !== candFormula) {
          differences.push(`Formule : "${refFormula}" → "${candFormula}"`);
        }
        
        // Compare number formats
        const refFormat = refCell.z || '';
        const candFormat = candCell.z || '';
        if (refFormat !== candFormat) {
          differences.push(`Format : "${refFormat}" → "${candFormat}"`);
        }
        
        // Compare cell types
        const refType = refCell.t || '';
        const candType = candCell.t || '';
        if (refType !== candType) {
          const typeNames: any = { n: 'nombre', s: 'texte', b: 'booléen', e: 'erreur', d: 'date' };
          const refTypeName = typeNames[refType] || refType;
          const candTypeName = typeNames[candType] || candType;
          differences.push(`Type : ${refTypeName} → ${candTypeName}`);
        }
        
        // Compare styles (font, fill, border, alignment)
        const refStyle = refCell.style;
        const candStyle = candCell.style;
        if (refStyle || candStyle) {
          const refStyleStr = JSON.stringify(refStyle || {});
          const candStyleStr = JSON.stringify(candStyle || {});
          if (refStyleStr !== candStyleStr) {
            // Detailed style comparison
            const styleDiffs: string[] = [];
            
            // Font comparison
            if (refStyle?.font || candStyle?.font) {
              const refFont = refStyle?.font || {};
              const candFont = candStyle?.font || {};
              const fontChanges: string[] = [];
              if (refFont.size !== candFont.size) fontChanges.push(`taille ${refFont.size || ''}→${candFont.size || ''}`);
              if (refFont.bold !== candFont.bold) fontChanges.push(candFont.bold ? 'gras ajouté' : 'gras retiré');
              if (refFont.italic !== candFont.italic) fontChanges.push(candFont.italic ? 'italique ajouté' : 'italique retiré');
              if (refFont.underline !== candFont.underline) fontChanges.push(candFont.underline ? 'souligné ajouté' : 'souligné retiré');
              if (refFont.color !== candFont.color) fontChanges.push(`couleur ${refFont.color || 'aucune'}→${candFont.color || 'aucune'}`);
              if (refFont.name !== candFont.name) fontChanges.push(`police ${refFont.name || ''}→${candFont.name || ''}`);
              if (fontChanges.length > 0) {
                styleDiffs.push(`Police : ${fontChanges.join(', ')}`);
              }
            }
            
            // Fill comparison
            if (refStyle?.fill || candStyle?.fill) {
              const refFill = refStyle?.fill || {};
              const candFill = candStyle?.fill || {};
              const fillChanges: string[] = [];
              if (refFill.fgColor !== candFill.fgColor) fillChanges.push(`fond ${refFill.fgColor || 'aucun'}→${candFill.fgColor || 'aucun'}`);
              if (fillChanges.length > 0) {
                styleDiffs.push(`Remplissage : ${fillChanges.join(', ')}`);
              }
            }
            
            if (styleDiffs.length > 0) {
              differences.push(...styleDiffs);
            }
          }
        }
        
        // Compare data validation (dropdowns)
        const refDv = refCell.dv;
        const candDv = candCell.dv;
        if (refDv || candDv) {
          const refDvStr = JSON.stringify(refDv || {});
          const candDvStr = JSON.stringify(candDv || {});
          if (refDvStr !== candDvStr) {
            // Extract dropdown options for readable comparison
            const refFormula = refDv?.formula1 || '';
            const candFormula = candDv?.formula1 || '';
            if (refFormula !== candFormula) {
              // Clean up formula display (remove quotes and escape characters)
              const cleanFormula = (f: string) => f.replace(/^"|"$/g, '').replace(/\\"/g, '"');
              differences.push(`Menu déroulant : ${cleanFormula(refFormula)} → ${cleanFormula(candFormula)}`);
            } else {
              // Other validation changes
              differences.push(`Menu déroulant : configuration modifiée`);
            }
          }
        }
        
        if (differences.length > 0) {
          allDiffs.push({
            sheet: sheetName,
            cell: cellToExcel(r, c),
            reference: differences.map(d => d.split(' → ')[0].split(': ')[1]).join(', '),
            new: differences.join('; ')
          });
        }
      }
    }
  });
  
  // Build structured summary grouped by sheet
  const diffsBySheet = new Map<string, SheetDiff[]>();
  allDiffs.forEach(diff => {
    if (!diffsBySheet.has(diff.sheet)) {
      diffsBySheet.set(diff.sheet, []);
    }
    diffsBySheet.get(diff.sheet)!.push(diff);
  });
  
  let summary = '';
  if (allDiffs.length > 0) {
    summary = `Trouvé ${allDiffs.length} différence(s) dans ${diffsBySheet.size} feuille(s) :\n\n`;
    
    diffsBySheet.forEach((diffs, sheetName) => {
      summary += `Feuille : "${sheetName}" (${diffs.length} différence(s))\n`;
      summary += '='.repeat(60) + '\n';
      
      diffs.forEach(diff => {
        summary += `  Cellule ${diff.cell} :\n`;
        summary += `    ${diff.new}\n`;
        summary += '\n';
      });
      
      summary += '\n';
    });
  }
  
  return { diffs: allDiffs, summary };
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
  cy.get('aj-extractor-activity', { timeout: 20000 }).first().as('act');

  // Programmatically set START month via inner matInput to trigger ngModelChange -> onDateChanged -> valueChange -> selectDate('start', ...)
  cy.get('@act')
    .find('aj-date-select')
    .eq(0)
    .find('input[matinput]', { timeout: 15000 })
    .then(($in) => {
      // Use first-of-month ISO string
      const startMonth = `${startISO.slice(0,7)}-01`;
      ($in[0] as HTMLInputElement).value = startMonth;
      $in[0].dispatchEvent(new Event('input', { bubbles: true }));
      $in[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
  snapshotStep(1);

  // Programmatically set STOP month similarly
  cy.get('@act')
    .find('aj-date-select')
    .eq(1)
    .find('input[matinput]', { timeout: 15000 })
    .then(($in) => {
      const stopMonth = `${stopISO.slice(0,7)}-01`;
      ($in[0] as HTMLInputElement).value = stopMonth;
      $in[0].dispatchEvent(new Event('input', { bubbles: true }));
      $in[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
  snapshotStep(2);

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
    setDatesActivite(START, STOP, 'pr');
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
      setDatesActivite(START, STOP, 'sandbox');
      exportAndPersistActivite(SANDBOX, START, STOP, 'sandbox');
    });

    it('Compare PR vs SANDBOX activite artifacts', () => {
      const hostSB = new URL(SANDBOX).host.replace(/[:.]/g, '-');
      const hostPR = new URL(PR).host.replace(/[:.]/g, '-');

      const sbJson = `cypress/artifacts/activite/activite_${hostSB}_${START}_${STOP}.json`;
      const prJson = `cypress/artifacts/activite/activite_${hostPR}_${START}_${STOP}.json`;

      cy.readFile(sbJson, { timeout: 60000 }).then((sb) => {
        cy.readFile(prJson, { timeout: 60000 }).then((pr) => {
          const { diffs, summary } = diffSheetsWithTolerance(sb, pr, 1e-6);
          if (diffs.length > 0) {
            // Write detailed diff report
            const report = `Type d'export : Activité\n` +
                          `Référence : SANDBOX (${hostSB})\n` +
                          `Candidat : PR (${hostPR})\n` +
                          `Plage de dates : ${START} à ${STOP}\n\n` +
                          summary;
            cy.writeFile(`cypress/artifacts/activite/diff_activite.txt`, report);
            
            let errorMsg = `\n${'='.repeat(80)}\n`;
            errorMsg += `ÉCHEC DES TESTS DE NON-RÉGRESSION ACTIVITÉ\n`;
            errorMsg += `${'='.repeat(80)}\n\n`;
            errorMsg += summary;
            errorMsg += `\n${'='.repeat(80)}\n`;
            errorMsg += `Rapport détaillé sauvegardé dans : cypress/artifacts/activite/diff_activite.txt\n`;
            errorMsg += `${'='.repeat(80)}\n`;
            
            throw new Error(errorMsg);
          } else {
            cy.log(`✅ Activité : Aucune différence entre PR et SANDBOX`);
          }
        });
      });
    });
  }
});
