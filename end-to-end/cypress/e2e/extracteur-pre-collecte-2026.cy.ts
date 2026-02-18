/// <reference types="cypress" />

import { setDatesEffectif, pickCategoryEffectif } from "../support/effectif-helpers";
import { authLoginApi } from "../../support/api";

// Suite: Extracteur Pre-Collecte 2026 - Baseline from frozen sandbox reference
// This test generates an Excel file from the SANDBOX stack (frozen at a specific commit)
// to serve as a baseline for comparing changes in the current branch.
//
// Configuration:
// - Uses SANDBOX frontend (front_sandbox) and API (api_sandbox) pointing to frozen reference directory
// - BACKUP_LABEL: TJ TEST
// - START: 2025-01-01
// - STOP: 2025-12-31
// - CATEGORY: Tous
//
// The sandbox reference should be set up using: scripts/setup-sandbox-reference.sh
// Run with: ./scripts/run-pre-collecte-2026-test.sh

const START = '2025-01-01';
const STOP = '2025-12-31';
const BACKUP_LABEL = 'TJ TEST';
const CATEGORY = 'Tous';
const SANDBOX_FRONT_URL = 'http://175.0.0.31:4200';
const SANDBOX_API_URL = 'http://175.0.0.21:8081/api';
const USER_EMAIL = 'utilisateurtest@a-just.fr';
const USER_PASSWORD = '@bUgGD25gX1b';

function categoryPattern(lbl: string): RegExp {
  if (/^Tous$/i.test(lbl)) return /^(Tous|Toutes|Toutes\s*(cat[eé]gories?)?)$/i;
  const esc = lbl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${esc}$`, 'i');
}

function snapshot(prefix: string, step: string) {
  // no-op: disable HTML snapshot files
}

describe('Extracteur Pre-Collecte 2026 - Baseline from Sandbox Reference', () => {
  
  before(() => {
    Cypress.session.clearAllSavedSessions();
    
    const user = { email: USER_EMAIL, password: USER_PASSWORD };
    let authToken: string;
    let backupId: number;
    
    // Login via sandbox API to get token
    return authLoginApi(SANDBOX_API_URL, user.email, user.password).then((resp) => {
      const userId = resp.body.user.id;
      authToken = resp.body.token;
      
      // Get ALL backups from sandbox database
      return cy.request({
        method: 'GET',
        url: `${SANDBOX_API_URL}/juridictions/get-all-backup`,
        headers: { Authorization: authToken },
      }).then((allBackupsResp) => {
        const allBackups = Array.isArray(allBackupsResp.body) ? allBackupsResp.body : (allBackupsResp.body.data || allBackupsResp.body.list || []);
        const e2eBackup = allBackups.find((b: any) => b.label === BACKUP_LABEL);
        
        if (!e2eBackup) {
          throw new Error(`${BACKUP_LABEL} not found in sandbox database`);
        }
        
        backupId = e2eBackup.id;
        
        // Full permissions matching E2E seeder
        const allPermissions = [
          1.1, 1.2,   // Dashboard (Panorama) - reader + writer
          2.1, 2.2,   // Ventilations - reader + writer
          3.1, 3.2,   // Activities - reader + writer
          4.1, 4.2,   // Average time - reader + writer
          5.1, 5.2,   // Calculator (Cockpit) - reader + writer
          6.1, 6.2,   // Simulator - reader + writer
          61.1, 61.2, // White simulator - reader + writer
          7.1, 7.2,   // Reaffectator - reader + writer
          8,          // HAS_ACCESS_TO_MAGISTRAT
          9,          // HAS_ACCESS_TO_GREFFIER
          10,         // HAS_ACCESS_TO_CONTRACTUEL
        ];
        
        // Assign user to TJ TEST backup via sandbox API with full permissions
        return cy.request({
          method: 'POST',
          url: `${SANDBOX_API_URL}/users/update-account`,
          headers: { Authorization: authToken },
          body: {
            userId: userId,
            access: allPermissions,
            ventilations: [backupId],
            referentielIds: null,
          },
        });
      });
    }).then(() => {
      // Manually inject auth into sandbox frontend (skip cy.login())
      cy.visit(SANDBOX_FRONT_URL);
      
      cy.window().then((win) => {
        win.localStorage.setItem('token', authToken);
        win.localStorage.setItem('backupId', String(backupId));
      });
      
      // Reload to apply auth
      cy.reload();
      
      // Wait for redirect to /panorama
      cy.location('pathname', { timeout: 60000 }).should('include', '/panorama');
    });
  });

  it('Generate sandbox baseline extractor output via UI', () => {
    cy.log('[NAVIGATION] Visiting sandbox dashboard...');
    
    // User is already logged in from before() hook, navigate to dashboard
    cy.visit(`${SANDBOX_FRONT_URL}/dashboard`);
    
    // Click on backup name to navigate to Extracteur (same as extracteur-collecte-2026)
    cy.log(`[NAVIGATION] Clicking on backup: ${BACKUP_LABEL}`);
    cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should('exist');
    cy.contains('h6, [data-cy="backup-name"]', new RegExp(`^${BACKUP_LABEL}$`, 'i'), { timeout: 20000 })
      .scrollIntoView()
      .click({ force: true });
    
    snapshot('pre-collecte-2026-sandbox', 'backup-clicked');
    
    // Set dates
    cy.log(`[DATES] Setting dates: ${START} to ${STOP}`);
    setDatesEffectif(START, STOP);
    
    // Pick category
    cy.log(`[CATEGORY] Selecting category: ${CATEGORY}`);
    pickCategoryEffectif(CATEGORY, categoryPattern(CATEGORY));
    
    // Setup download hooks
    cy.window().then((win) => {
        try {
          (win as any).__downloadStarted = false;
          (win as any).__lastDownloadName = '';
          (win as any).__lastDownloadBase64 = '';
          
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
      
      // Click export button
      cy.log('[EXPORT] Clicking export button...');
      cy.get('body').then(($body) => {
        if ($body.find('#export-excel-button').length) {
          cy.get('#export-excel-button').scrollIntoView().click({ force: true });
        } else {
          cy.get('aj-extractor-ventilation > div.exportateur-container > div > p', { timeout: 15000 }).scrollIntoView().click({ force: true });
        }
      });
      
      snapshot('pre-collecte-2026-sandbox', 'export-clicked');
      
      // Handle modal if present
      const modalContainerSel = 'aj-alert, aj-popup, .cdk-overlay-pane .mat-mdc-dialog-container, .cdk-overlay-pane mat-dialog-container, .cdk-overlay-pane [role=dialog], .cdk-overlay-pane aj-popup';
      const modalButtonsSel = 'aj-alert button, aj-popup button, .cdk-overlay-pane [role=dialog] button, .cdk-overlay-pane .mat-mdc-dialog-container button, .cdk-overlay-pane mat-dialog-container button, .cdk-overlay-pane button';
      
      cy.get('body', { timeout: 500 }).then(($b) => {
        const has = $b.find(modalContainerSel).length > 0;
        if (has) {
          cy.get(modalContainerSel, { timeout: 15000 }).should('be.visible');
          snapshot('pre-collecte-2026-sandbox', 'modal-visible');
          
          cy.get(modalButtonsSel, { timeout: 15000 }).then(($btns) => {
            const arr = Array.from($btns as any);
            const okBtn = (arr as any[]).find((b: any) => /ok/i.test(((b as any).textContent || '').trim()));
            if (okBtn) cy.wrap(okBtn).click({ force: true });
            else if ($btns.length) cy.wrap($btns[0]).click({ force: true });
            else cy.get('div.cdk-overlay-backdrop').click({ force: true });
          });
          snapshot('pre-collecte-2026-sandbox', 'ok-clicked');
        }
      });
      
      // Wait for download to complete
      cy.log('[DOWNLOAD] Waiting for file download...');
      cy.window().then((win) => {
        return new Cypress.Promise((resolve) => {
          const checkDownload = () => {
            if ((win as any).__lastDownloadBase64) {
              resolve((win as any).__lastDownloadBase64);
            } else {
              setTimeout(checkDownload, 500);
            }
          };
          checkDownload();
        });
    }).then((base64: any) => {
      const fileName = `Extraction_PRE_COLLECTE_2026_SANDBOX_BASELINE_${START}_${STOP}.xlsx`;
      const filePath = `cypress/downloads/${fileName}`;
      
      cy.log(`[DOWNLOAD] Saving file: ${fileName}`);
      cy.writeFile(filePath, base64, 'base64').then(() => {
        cy.log(`[DOWNLOAD] File saved successfully`);
        
        // Verify file size
        cy.readFile(filePath, 'binary').then((content) => {
          const size = content.length;
          cy.log(`[DOWNLOAD] File size: ${size} bytes`);
          expect(size).to.be.greaterThan(10000); // Sanity check
        });
      });
    });
  });
});
