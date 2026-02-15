/// <reference types="cypress" />

import { loginAndOpenDashboard, setDatesEffectif, pickCategoryEffectif } from "../support/effectif-helpers";
import { loginApi, getUserDataApi, resetToDefaultPermissions } from "../../support/api";
import user from "../../fixtures/user.json";

// Import comparison utilities from effectif-suite to avoid duplication
// These are defined in effectif-suite.cy.ts but not exported, so we'll inline them here
function colToExcel(col: number): string {
  let result = '';
  let c = col;
  while (c >= 0) {
    result = String.fromCharCode(65 + (c % 26)) + result;
    c = Math.floor(c / 26) - 1;
  }
  return result;
}

function cellToExcel(row: number, col: number): string {
  return `${colToExcel(col)}${row + 1}`;
}

interface SheetDiff {
  sheet: string;
  cell: string;
  reference: string;
  new: string;
}

// Simplified comparison function - compares values only, not styles/formulas
function diffSheetsWithTolerance(reference: any, candidate: any, eps = 1e-6): { diffs: SheetDiff[]; summary: string } {
  const allDiffs: SheetDiff[] = [];
  const sheetsRef = Object.keys((reference && reference.sheets) || {});
  const sheetsCand = Object.keys((candidate && candidate.sheets) || {});
  const allSheetNames = Array.from(new Set([...sheetsRef, ...sheetsCand]));

  allSheetNames.forEach((sheetName) => {
    const refSheet: any[][] = (reference && reference.sheets && reference.sheets[sheetName]) || [];
    const candSheet: any[][] = (candidate && candidate.sheets && candidate.sheets[sheetName]) || [];
    const maxR = Math.max(refSheet.length, candSheet.length);

    for (let r = 0; r < maxR; r++) {
      const refRow = refSheet[r] || [];
      const candRow = candSheet[r] || [];
      const maxC = Math.max(refRow.length, candRow.length);

      for (let c = 0; c < maxC; c++) {
        const refVal = refRow[c];
        const candVal = candRow[c];
        
        // Simple value comparison
        const refIsNum = typeof refVal === 'number';
        const candIsNum = typeof candVal === 'number';
        
        if (refIsNum || candIsNum) {
          const nRef = Number(refVal);
          const nCand = Number(candVal);
          if (!(Number.isFinite(nRef) && Number.isFinite(nCand) && Math.abs(nRef - nCand) <= eps)) {
            allDiffs.push({
              sheet: sheetName,
              cell: cellToExcel(r, c),
              reference: String(refVal),
              new: String(candVal)
            });
          }
        } else {
          const refStr = String(refVal ?? '').trim();
          const candStr = String(candVal ?? '').trim();
          if (refStr !== candStr) {
            allDiffs.push({
              sheet: sheetName,
              cell: cellToExcel(r, c),
              reference: refStr,
              new: candStr
            });
          }
        }
      }
    }
  });

  let summary = '';
  if (allDiffs.length > 0) {
    summary = `Trouvé ${allDiffs.length} différence(s) :\n\n`;
    allDiffs.slice(0, 50).forEach((diff) => {
      summary += `  ${diff.sheet}!${diff.cell}: "${diff.reference}" → "${diff.new}"\n`;
    });
    if (allDiffs.length > 50) {
      summary += `  ... et ${allDiffs.length - 50} autres différences\n`;
    }
  } else {
    summary = 'Aucune différence trouvée.';
  }

  return { diffs: allDiffs, summary };
}

// Suite: Extracteur Collecte 2026 - Test de non-régression avec référence fournie
// Ce test compare l'extracteur actuel avec un fichier de référence Excel fourni.
//
// Configuration:
// - BACKUP_LABEL: Nom de la sauvegarde à utiliser (default: test010)
// - START: Date de début (default: 2025-01-01)
// - STOP: Date de fin (default: 2025-12-31)
// - REFERENCE_FILE: Chemin vers le fichier de référence (default: extracteur-collecte-2026-reference.xlsx)
//
// Le fichier de référence doit être placé dans:
// end-to-end/cypress/fixtures/extracteur-collecte-2026-reference.xlsx

const START = '2023-01-01';
const STOP = '2023-03-31';
const BACKUP_LABEL = '24fb8bb550';
const REFERENCE_FILE = 'extracteur-collecte-2026-reference.xlsx';
const CATEGORY = 'Tous'; // Toutes les catégories

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
  // no-op: disable HTML snapshot files
}

function slugifyLabel(lbl: string): string {
  return lbl
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function categoryPattern(lbl: string): RegExp {
  if (/^Tous$/i.test(lbl)) return /^(Tous|Toutes|Toutes\s*(cat[eé]gories?)?)$/i;
  const esc = lbl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${esc}$`, 'i');
}

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

// Note: We use the existing comparateur-extracteurs CLI tool instead of duplicating comparison logic
// Note: Helper functions (loginAndOpenDashboard, setDatesEffectif, pickCategoryEffectif) are imported from shared module

// Poll window.__lastDownloadBase64 and persist when available
function persistBase64WhenReady(defaultFileName: string, maxMs = 240000, intervalMs = 1000) {
  const start = Date.now();
  const loop = (): Cypress.Chainable<any> => {
    return cy.window({ log: false }).then((win: any) => {
      try {
        const b64 = String((win && win.__lastDownloadBase64) || '');
        const nm = String((win && win.__lastDownloadName) || '') || defaultFileName;
        const dlStarted = !!(win && win.__downloadStarted);
        if (b64 && b64.length > 100) {
          return cy.task('writeBufferToDownloads', { base64: b64, fileName: nm }, { timeout: 200000 }).then(() => undefined);
        }
        if (dlStarted && Date.now() - start > 5000) {
          return cy.wrap(null, { log: false });
        }
      } catch {}
      if (Date.now() - start >= maxMs) return cy.wrap(null, { log: false });
      return cy.wait(intervalMs, { log: false }).then(loop);
    });
  };
  return loop();
}

function exportAndPersist(baseUrl: string, startISO: string, stopISO: string) {
  cy.task('wipeDownloads');
  
  // Intercepts
  cy.intercept('POST', '**/api/extractor/**').as('effData');
  cy.intercept('GET', '**/assets/*.xlsx*').as('effTpl');
  cy.intercept('POST', '**/api/extractor/start-filter-list').as('effStart');
  cy.intercept('POST', '**/api/extractor/status-filter-list-post').as('effStatus');
  
  snapshot('collecte2026', 'step6-downloads-wiped');
  
  // Install download hooks
  cy.window({ log: false }).then((win: any) => {
    try {
      try { (win as any).__AJ_E2E_EXPORT_MAX_MS = 1200000; } catch {}
      try { (win as any).localStorage && (win as any).localStorage.setItem('__AJ_E2E_EXPORT_MAX_MS', '1200000'); } catch {}
      (win as any).__downloadStarted = false;
      (win as any).__lastDownloadName = '';
      (win as any).__lastDownloadBase64 = '';
      
      // Hook fetch for cache-busting
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
      
      // Hook URL.createObjectURL
      const origCreate = win.URL && win.URL.createObjectURL;
      if (origCreate && !(win as any).__hookedCreateObjectURL) {
        (win as any).__hookedCreateObjectURL = true;
        win.URL.createObjectURL = function(blob: any) {
          try { (win as any).__downloadStarted = true; } catch {}
          return origCreate.apply(this, arguments as any);
        } as any;
      }
      
      // Hook anchor click
      const proto = (win as any).HTMLAnchorElement && (win as any).HTMLAnchorElement.prototype;
      if (proto && !(win as any).__aClickHooked) {
        (win as any).__aClickHooked = true;
        const origClick = proto.click;
        proto.click = function(this: HTMLAnchorElement) {
          try {
            const nm = (this as any).download || '';
            const href = (this as any).href || '';
            if (nm) (win as any).__lastDownloadName = String(nm);
            if (href) {
              (win as any).__downloadStarted = true;
              if (/^blob:/i.test(href)) {
                try {
                  (win as any)
                    .fetch(href)
                    .then((r: any) => (r && r.blob ? r.blob() : null))
                    .then((b: any) => {
                      if (!b) return;
                      const reader = new (win as any).FileReader();
                      reader.onloadend = () => {
                        try {
                          const res = String(reader.result || '');
                          const base64 = res.includes(',') ? res.split(',')[1] : res;
                          (win as any).__lastDownloadBase64 = base64;
                        } catch {}
                      };
                      try { reader.readAsDataURL(b); } catch {}
                    })
                    .catch(() => {});
                } catch {}
              }
            }
          } catch {}
          return origClick.apply(this, arguments as any);
        } as any;
      }
      
      // Hook saveAs
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
        if ((win as any).saveAs) (win as any).saveAs = wrapper; 
        else if ((win as any).FileSaver) (win as any).FileSaver.saveAs = wrapper;
      }
    } catch {}
  });
  
  // Fail fast on alert
  cy.on('window:alert', (text) => {
    snapshot('collecte2026', 'step7-window-alert');
    throw new Error(`export.alert: ${String(text || '').trim()}`);
  });
  
  // Close overlays
  cy.get('body').then(($b) => {
    const bd = $b.find('div.cdk-overlay-backdrop');
    if (bd.length) cy.wrap(bd.get(0)).click({ force: true });
  });
  
  // Click export button
  cy.get('body').then(($body) => {
    if ($body.find('#export-excel-button').length) {
      cy.get('#export-excel-button').scrollIntoView().click({ force: true });
    } else {
      cy.get('aj-extractor-ventilation > div.exportateur-container > div > p', { timeout: 15000 }).scrollIntoView().click({ force: true });
    }
  });
  
  snapshot('collecte2026', 'step8-export-clicked');
  
  // Handle modal if present
  const modalContainerSel = 'aj-alert, aj-popup, .cdk-overlay-pane .mat-mdc-dialog-container, .cdk-overlay-pane mat-dialog-container, .cdk-overlay-pane [role=dialog], .cdk-overlay-pane aj-popup';
  const modalButtonsSel = 'aj-alert button, aj-popup button, .cdk-overlay-pane [role=dialog] button, .cdk-overlay-pane .mat-mdc-dialog-container button, .cdk-overlay-pane mat-dialog-container button, .cdk-overlay-pane button';
  
  cy.get('body', { timeout: 500 }).then(($b) => {
    const has = $b.find(modalContainerSel).length > 0;
    if (has) {
      cy.get(modalContainerSel, { timeout: 15000 }).should('be.visible');
      snapshot('collecte2026', 'step9-modal-visible');
      
      cy.get(modalContainerSel).then(($m) => {
        const txt = ($m.text() || '').trim();
        if (/Impossible\s+de\s+d[ée]marrer\s+l['']export|Erreur\s+serveur|Erreur\s+de\s+communication|Polling\s+timeout/i.test(txt)) {
          snapshot('collecte2026', 'step9-modal-error');
          throw new Error(`export.error.modal: ${txt.slice(0, 300)}`);
        }
      });
      
      cy.get(modalButtonsSel, { timeout: 15000 }).then(($btns) => {
        const arr = Array.from($btns as any);
        const okBtn = (arr as any[]).find((b: any) => /ok/i.test(((b as any).textContent || '').trim()));
        if (okBtn) cy.wrap(okBtn).click({ force: true });
        else if ($btns.length) cy.wrap($btns[0]).click({ force: true });
        else cy.get('div.cdk-overlay-backdrop').click({ force: true });
      });
      snapshot('collecte2026', 'step9-ok-clicked');
    }
  });
  
  // Second modal check after delay
  cy.wait(2500);
  cy.document().then((doc) => {
    const $lateModal = Cypress.$(modalContainerSel, doc);
    if ($lateModal && $lateModal.length) {
      snapshot('collecte2026', 'step10-modal-visible-late');
      const $buttons = Cypress.$(modalButtonsSel, doc);
      const ok = Array.from($buttons).find((b: any) => /ok/i.test(((b as any).textContent || '').trim()));
      if (ok) (ok as HTMLElement).click();
      else if ($buttons.length) ($buttons.get(0) as HTMLElement).click();
      else {
        const $backdrop = Cypress.$('div.cdk-overlay-backdrop', doc);
        if ($backdrop.length) ($backdrop.get(0) as HTMLElement).click();
      }
      snapshot('collecte2026', 'step10-ok-clicked-late');
    }
  });
  
  // Persist from base64
  persistBase64WhenReady(`effectif_${START}_${STOP}.xlsx`, 15000);
  
  // Wait for download
  cy.task('waitForDownloadedExcel', { timeoutMs: 1200000 }, { timeout: 1220000 }).then((fileName: string) => {
    const targetBase = `extracteur-collecte-2026-current`;
    snapshot('collecte2026', 'step11-download-detected');
    return cy.task('moveAndNormalizeXlsx', { fileName, targetBase }).then(() => {
      snapshot('collecte2026', 'step12-artifacts-written');
      cy.readFile(`cypress/artifacts/effectif/${targetBase}.json`, { timeout: 120000 });
    });
  });
}

describe('Extracteur Collecte 2026 - Test de non-régression', () => {
  before(() => {
    // Ensure user has full permissions before tests run, then do UI login
    // This prevents redirection to /bienvenue and ensures access to all tools
    return loginApi(user.email, user.password).then((resp) => {
      const userId = resp.body.user.id;
      const token = resp.body.token;
      
      return getUserDataApi(token).then((resp) => {
        const backups = resp.body.data.backups;
        
        // Log to terminal via cy.task
        return cy.task('log', `[DB DEBUG] User ID: ${userId}`).then(() => {
          return cy.task('log', `[DB DEBUG] Found ${backups.length} backups in database:`);
        }).then(() => {
          return cy.task('log', `[DB DEBUG] Backups: ${JSON.stringify(backups.map((b: any) => ({ id: b.id, label: b.label })), null, 2)}`);
        }).then(() => {
          const ventilations = backups.map((v: any) => v.id);
          return cy.task('log', `[DB DEBUG] Setting permissions for backup IDs: ${ventilations.join(', ')}`).then(() => {
            // Check if target backup exists
            const targetBackup = backups.find((b: any) => b.label === BACKUP_LABEL);
            if (targetBackup) {
              return cy.task('log', `[DB DEBUG] ✓ Found ${BACKUP_LABEL} backup with ID: ${targetBackup.id}`);
            } else {
              return cy.task('log', `[DB DEBUG] ✗ WARNING: ${BACKUP_LABEL} backup NOT FOUND in database!`).then(() => {
                return cy.task('log', `[DB DEBUG] Available backups: ${backups.map((b: any) => b.label).join(', ')}`);
              });
            }
          }).then(() => {
            return resetToDefaultPermissions(userId, ventilations, token);
          });
        });
      });
    }).then(() => {
      return cy.task('log', '[LOGIN] Starting cy.login()...').then(() => {
        // @ts-ignore - cy.login() implementation doesn't use parameters despite type definition
        return cy.login();
      }).then(() => {
        return cy.task('log', '[LOGIN] cy.login() completed successfully');
      }).then(() => {
        // Wait for redirect to /panorama to ensure app is fully initialized (matches effectif-suite.cy.ts)
        return cy.task('log', '[LOGIN] Waiting for redirect to /panorama...').then(() => {
          return cy.location('pathname', { timeout: 60000 }).should('include', '/panorama');
        }).then(() => {
          return cy.task('log', '[LOGIN] Redirected to /panorama, app is ready');
        });
      });
    });
  });

  it('Convert reference file to JSON', () => {
    // Convert the reference Excel file to JSON for comparison
    // Use absolute path to avoid the task joining it with downloadsDir
    const fixturePath = Cypress.config('fileServerFolder') + `/cypress/fixtures/${REFERENCE_FILE}`;
    cy.task('moveAndNormalizeXlsxTo', {
      fileName: fixturePath,
      targetBase: 'extracteur-collecte-2026-reference',
      subdir: 'effectif'
    }).then(() => {
      cy.readFile('cypress/artifacts/effectif/extracteur-collecte-2026-reference.json', { timeout: 60000 })
        .should('exist');
    });
  });

  it('Generate current extractor output', () => {
    const baseUrl = Cypress.config('baseUrl') || 'http://localhost:4200';
    
    // User is already logged in from before() hook, just select the backup
    cy.visit(`${baseUrl}/dashboard`);
    cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should('exist');
    cy.contains('h6, [data-cy="backup-name"]', new RegExp(`^${BACKUP_LABEL}$`, 'i'), { timeout: 20000 })
      .scrollIntoView()
      .click({ force: true });
    setDatesEffectif(START, STOP);
    pickCategoryEffectif(CATEGORY);
    exportAndPersist(baseUrl, START, STOP);
  });

  it('Compare current output with reference', () => {
    const refJson = 'cypress/artifacts/effectif/extracteur-collecte-2026-reference.json';
    const currentJson = 'cypress/artifacts/effectif/extracteur-collecte-2026-current.json';
    
    // Read both JSON files and compare in browser context (like effectif-suite.cy.ts)
    cy.readFile(refJson, { timeout: 60000 }).then((reference) => {
      cy.readFile(currentJson, { timeout: 60000 }).then((current) => {
        // Use the shared comparison function from effectif-helpers
        const { diffs, summary } = diffSheetsWithTolerance(reference, current, 1e-6);
        
        if (diffs.length > 0) {
          // Write detailed diff report
          const report = `Extracteur Collecte 2026 - Rapport de différences\n` +
                        `${'='.repeat(80)}\n` +
                        `Référence : ${REFERENCE_FILE}\n` +
                        `Période : ${START} à ${STOP}\n` +
                        `Catégorie : ${CATEGORY}\n` +
                        `Backup : ${BACKUP_LABEL}\n\n` +
                        summary;
          
          // Save to file
          cy.writeFile('cypress/artifacts/effectif/extracteur-collecte-2026-diff.txt', report);
          
          // Log to console
          cy.log(`❌ ${diffs.length} différences trouvées`);
          console.log(report);
          
          // Fail the test with structured error
          let errorMsg = `\n${'='.repeat(80)}\n`;
          errorMsg += `ÉCHEC : L'extracteur actuel diffère de la référence\n`;
          errorMsg += `${'='.repeat(80)}\n\n`;
          errorMsg += summary;
          errorMsg += `\n${'='.repeat(80)}\n`;
          errorMsg += `Rapport détaillé : cypress/artifacts/effectif/extracteur-collecte-2026-diff.txt\n`;
          errorMsg += `${'='.repeat(80)}\n`;
          
          throw new Error(errorMsg);
        } else {
          cy.log(`✅ L'extracteur actuel correspond à la référence`);
        }
      });
    });
  });
});
