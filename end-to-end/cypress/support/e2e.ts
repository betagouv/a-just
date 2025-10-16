/// <reference types="cypress" />
// Mirror sandbox: load custom commands and reporter, register cy-verify-downloads
import '../../support/commands';
import addCustomCommand from 'cy-verify-downloads';
import 'cypress-mochawesome-reporter/register';

// Also register via require to match sandbox behavior
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('cy-verify-downloads').addCustomCommand();

// Debug helpers to capture AUT console logs into cypress/reports

declare global {
  namespace Cypress {
    interface Chainable {
      enableDebugLogging(tag?: string): Chainable<void>;
      flushDebugLogs(tag: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('enableDebugLogging', (tag?: string) => {
  Cypress.on('window:before:load', (win) => {
    try {
      (win as any).__e2eLogs = [];
      const levels: Array<keyof Console> = ['error', 'warn', 'log'];
      levels.forEach((lvl) => {
        const orig = (win.console as any)[lvl] as (...args: any[]) => void;
        (win.console as any)[lvl] = (...args: any[]) => {
          try {
            const line = `[${lvl}] ` + args.map((a) => {
              try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); }
            }).join(' ');
            (win as any).__e2eLogs.push(line);
          } catch {}
          try { orig && orig.apply(win.console, args); } catch {}
        };
      });
    } catch {}
  });
});

Cypress.Commands.add('flushDebugLogs', (tag: string) => {
  cy.window({ log: false }).then((win: any) => {
    try {
      const lines: string[] = (win && win.__e2eLogs) || [];
      const content = lines.join('\n');
      return cy.task('saveDomHtml', { filename: `console-${tag}.txt`, html: content }, { log: false });
    } catch {
      // ignore
    }
  });
});

export {};

// Sandbox parity: basic session cleanup before run
before(() => {
  try { cy.clearCookies(); } catch {}
  try { cy.clearLocalStorage(); } catch {}
  try { cy.reload(); } catch {}
});

// Ignore ResizeObserver noise like in sandbox
Cypress.on('uncaught:exception', (err) => {
  if (err && /ResizeObserver loop completed with undelivered notifications/i.test(String(err.message || ''))) {
    return false;
  }
  return true;
});
