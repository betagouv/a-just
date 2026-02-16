/// <reference types="cypress" />

import user from "../../fixtures/user.json";

/**
 * Shared helper functions for effectif extractor tests
 * Used by: effectif-suite.cy.ts, extracteur-collecte-2026.cy.ts
 */

export function loginAndOpenDashboard(baseUrl: string, backupLabel: string) {
  cy.clearAllLocalStorage();
  cy.clearCookies();
  cy.visit(`${baseUrl}/connexion`, { timeout: 60000 });
  cy.get('body', { timeout: 60000 }).should('be.visible');
  cy.url().should('include', '/connexion');
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
      cy.contains('.sso-bt, button, [role=button]', /Pages Blanches|SSO|Se connecter avec Pages Blanches/i, { timeout: 10000 })
        .click({ force: true });
    }
  });
  // After login, visit dashboard to select backup (user may be on /bienvenue or /panorama)
  cy.visit(`${baseUrl}/dashboard`);
  cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should('exist');
  cy.contains('h6, [data-cy="backup-name"]', new RegExp(`^${backupLabel}$`, 'i'), { timeout: 20000 })
    .scrollIntoView()
    .click({ force: true });
}

export function setDatesEffectif(startISO: string, stopISO: string) {
  cy.get('aj-extractor-ventilation', { timeout: 20000 }).first().as('eff');

  // Set START date
  cy.get('@eff')
    .find('aj-date-select')
    .eq(0)
    .find('input[matinput]', { timeout: 15000 })
    .then(($in) => {
      ($in[0] as HTMLInputElement).value = startISO;
      $in[0].dispatchEvent(new Event('input', { bubbles: true }));
      $in[0].dispatchEvent(new Event('change', { bubbles: true }));
    });

  // Set STOP date
  cy.get('@eff')
    .find('aj-date-select')
    .eq(1)
    .find('input[matinput]', { timeout: 15000 })
    .then(($in) => {
      ($in[0] as HTMLInputElement).value = stopISO;
      $in[0].dispatchEvent(new Event('input', { bubbles: true }));
      $in[0].dispatchEvent(new Event('change', { bubbles: true }));
    });

  // Close any lingering overlays
  cy.get('body').then(($b) => {
    const bd = $b.find('div.cdk-overlay-backdrop');
    if (bd.length) cy.wrap(bd.get(0)).click({ force: true });
  });
}

function categoryPattern(lbl: string): RegExp {
  if (/^Si(e|è|é)ge$/i.test(lbl) || /^Si[eè]ge$/i.test(lbl)) return /^Si[eè]ge$/i;
  if (/^Equipe autour du magistrat$/i.test(lbl)) return /^(É|E)quipe autour du magistrat$/i;
  if (/^Greffe$/i.test(lbl)) return /^Greffe$/i;
  if (/^Tous$/i.test(lbl)) return /^(Tous|Toutes|Toutes\s*(cat[eé]gories?)?)$/i;
  const esc = lbl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${esc}$`, 'i');
}

export function pickCategoryEffectif(categoryLabel: string) {
  cy.get('aj-extractor-ventilation', { timeout: 20000 }).first().as('eff');
  
  // Open the category selector
  cy.get('@eff').then($eff => {
    const hasIcon = $eff.find('aj-select mat-icon').length > 0;
    if (hasIcon) {
      cy.wrap($eff).find('aj-select mat-icon', { timeout: 15000 }).scrollIntoView().click({ force: true });
    } else {
      cy.wrap($eff).find('aj-select > div > p', { timeout: 15000 }).scrollIntoView().click({ force: true });
    }
  });
  
  const pat = categoryPattern(categoryLabel);
  cy.get('.cdk-overlay-pane', { timeout: 15000 }).last().then(($ov) => {
    // 0) Siège special-case
    if (/^si[eè]ge$/i.test(categoryLabel)) {
      const siegeDirect = $ov.find('#mat-option-0 > mat-pseudo-checkbox');
      if (siegeDirect.length) {
        cy.wrap(siegeDirect[0]).click({ force: true });
        cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
        cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
        return;
      }
    }
    
    // 1) Try standard mat-option text
    const matNodes = Array.from($ov.find('mat-option .mat-option-text, mat-option')) as HTMLElement[];
    const matOpt = matNodes.find((el) => pat.test((el.textContent || '').trim()));
    if (matOpt) {
      cy.wrap(matOpt).click({ force: true });
      cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
      cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
      return;
    }
    
    // 2) Special handling for "Tous": checkbox/aria
    if (/^tous$/i.test(categoryLabel)) {
      const aria = $ov.find('[aria-label="Tous"], [aria-label="Toutes"], [aria-label*="Toutes"]');
      if (aria.length) {
        cy.wrap(aria[0]).click({ force: true });
        cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
        cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
        return;
      }
      const idNode = $ov.find('#mat-mdc-checkbox-0-input');
      if (idNode.length) {
        cy.wrap(idNode[0]).click({ force: true });
        cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
        cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
        return;
      }
      // Find visible text node 'Tous' and click closest clickable container
      const allNodes = Array.from($ov.find('*')) as HTMLElement[];
      const textEl = allNodes.find((el) => /^Tous$/i.test((el.textContent || '').trim()));
      if (textEl) {
        const clickable = (textEl.closest && (textEl.closest('label, .mdc-form-field, .mat-mdc-checkbox') as HTMLElement)) || textEl;
        cy.wrap(clickable).click({ force: true });
        cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
        cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
        return;
      }
    }
    
    // 3) Fallback for non-"Tous": match loosely and click pseudo-checkbox
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
      const direct = $ov.find('#mat-option-0 > mat-pseudo-checkbox');
      if (direct.length) {
        cy.wrap(direct[0]).click({ force: true });
      } else {
        const pchk = (matchOpt.querySelector('mat-pseudo-checkbox') as HTMLElement) || matchOpt;
        cy.wrap(pchk).click({ force: true });
      }
      cy.get('div.cdk-overlay-backdrop').then($b => { if ($b.length) cy.wrap($b).click({ force: true }); });
      cy.get('@eff').find('aj-select > div > p').invoke('text').then(t => cy.log(`category.display: ${String(t).trim()}`));
      return;
    }
    throw new Error(`Category option not found in overlay: ${categoryLabel}`);
  });
}
