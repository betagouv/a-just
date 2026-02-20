/// <reference types="cypress" />

import user from "../../fixtures/user.json";

// Suite: Effectif exports for PR and SANDBOX across categories, then compare.
// Env needed:
// - SANDBOX_FRONT_URL
// - CANDIDATE_FRONT_URL
// Optional:
// - BACKUP_LABEL (default: TJ TEST)
// - START (default: 2023-01-01)
// - STOP (default: 2024-06-15)
// Recommendation: run with CYPRESS_DISABLE_SNAPSHOT_AFTER_EACH=1 to avoid global afterEach snapshots.

// Dates defined in-file for determinism in local and CI runs
const START = "2023-01-01";
const STOP = "2023-03-31";
// Hosts defined in-file to remove dependency on env wiring
const BACKUP_LABEL = "TJ TEST"; // Fixed label from anonymization script
const SANDBOX = "http://175.0.0.31:4200";
const PR = "http://175.0.0.30:4200";

const CATEGORIES: string[] = ["Tous"];

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
  // no-op: disable HTML snapshot files
}

function slugifyLabel(lbl: string): string {
  return lbl
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function categoryPattern(lbl: string): RegExp {
  // Handle accents for provided labels
  if (/^Si(e|è|é)ge$/i.test(lbl) || /^Si[eè]ge$/i.test(lbl))
    return /^Si[eè]ge$/i;
  if (/^Equipe autour du magistrat$/i.test(lbl))
    return /^(É|E)quipe autour du magistrat$/i;
  if (/^Greffe$/i.test(lbl)) return /^Greffe$/i;
  if (/^Tous$/i.test(lbl)) return /^(Tous|Toutes|Toutes\s*(cat[eé]gories?)?)$/i;
  // Fallback: exact case-insensitive
  const esc = lbl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${esc}$`, "i");
}

// Convert column index to Excel letter (0 -> A, 1 -> B, 25 -> Z, 26 -> AA, etc.)
function colToExcel(col: number): string {
  let result = "";
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

function diffSheetsWithTolerance(
  reference: any,
  candidate: any,
  eps = 1e-6,
): { diffs: SheetDiff[]; summary: string } {
  const allDiffs: SheetDiff[] = [];
  const sheetsRef = Object.keys((reference && reference.sheets) || {});
  const sheetsCand = Object.keys((candidate && candidate.sheets) || {});
  const allSheetNames = Array.from(new Set([...sheetsRef, ...sheetsCand]));

  // Helper to extract cell properties (handles both simple values and complex cell objects)
  const getCellProps = (cell: any) => {
    if (cell === null || cell === undefined || cell === "") {
      return {
        v: "",
        f: undefined,
        z: undefined,
        t: undefined,
        style: undefined,
        dv: undefined,
      };
    }
    if (typeof cell === "object" && !Array.isArray(cell)) {
      return {
        v: cell.v ?? "",
        f: cell.f,
        z: cell.z,
        t: cell.t,
        style: cell.style,
        dv: cell.dv,
      };
    }
    // Simple value (backward compatibility)
    return {
      v: cell,
      f: undefined,
      z: undefined,
      t: undefined,
      style: undefined,
      dv: undefined,
    };
  };

  allSheetNames.forEach((sheetName) => {
    const refSheet: any[][] =
      (reference && reference.sheets && reference.sheets[sheetName]) || [];
    const candSheet: any[][] =
      (candidate && candidate.sheets && candidate.sheets[sheetName]) || [];
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
        const refIsNum = typeof refCell.v === "number";
        const candIsNum = typeof candCell.v === "number";
        if (refIsNum || candIsNum) {
          const nRef = Number(refCell.v);
          const nCand = Number(candCell.v);
          if (
            !(
              Number.isFinite(nRef) &&
              Number.isFinite(nCand) &&
              Math.abs(nRef - nCand) <= eps
            )
          ) {
            differences.push(`Valeur : ${refCell.v} → ${candCell.v}`);
          }
        } else {
          const refStr = String(refCell.v ?? "").trim();
          const candStr = String(candCell.v ?? "").trim();
          if (refStr !== candStr) {
            differences.push(`Valeur : "${refStr}" → "${candStr}"`);
          }
        }

        // Compare formulas
        const refFormula = refCell.f || "";
        const candFormula = candCell.f || "";
        if (refFormula !== candFormula) {
          differences.push(`Formule : "${refFormula}" → "${candFormula}"`);
        }

        // Compare number formats
        const refFormat = refCell.z || "";
        const candFormat = candCell.z || "";
        if (refFormat !== candFormat) {
          differences.push(`Format : "${refFormat}" → "${candFormat}"`);
        }

        // Compare cell types
        const refType = refCell.t || "";
        const candType = candCell.t || "";
        if (refType !== candType) {
          const typeNames: any = {
            n: "nombre",
            s: "texte",
            b: "booléen",
            e: "erreur",
            d: "date",
          };
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
              if (refFont.size !== candFont.size)
                fontChanges.push(
                  `taille ${refFont.size || ""}→${candFont.size || ""}`,
                );
              if (refFont.bold !== candFont.bold)
                fontChanges.push(candFont.bold ? "gras ajouté" : "gras retiré");
              if (refFont.italic !== candFont.italic)
                fontChanges.push(
                  candFont.italic ? "italique ajouté" : "italique retiré",
                );
              if (refFont.underline !== candFont.underline)
                fontChanges.push(
                  candFont.underline ? "souligné ajouté" : "souligné retiré",
                );
              if (refFont.color !== candFont.color)
                fontChanges.push(
                  `couleur ${refFont.color || "aucune"}→${candFont.color || "aucune"}`,
                );
              if (refFont.name !== candFont.name)
                fontChanges.push(
                  `police ${refFont.name || ""}→${candFont.name || ""}`,
                );
              if (fontChanges.length > 0) {
                styleDiffs.push(`Police : ${fontChanges.join(", ")}`);
              }
            }

            // Fill comparison
            if (refStyle?.fill || candStyle?.fill) {
              const refFill = refStyle?.fill || {};
              const candFill = candStyle?.fill || {};
              const fillChanges: string[] = [];
              if (refFill.fgColor !== candFill.fgColor)
                fillChanges.push(
                  `fond ${refFill.fgColor || "aucun"}→${candFill.fgColor || "aucun"}`,
                );
              if (fillChanges.length > 0) {
                styleDiffs.push(`Remplissage : ${fillChanges.join(", ")}`);
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
            const refFormula = refDv?.formula1 || "";
            const candFormula = candDv?.formula1 || "";
            if (refFormula !== candFormula) {
              // Clean up formula display (remove quotes and escape characters)
              const cleanFormula = (f: string) =>
                f.replace(/^"|"$/g, "").replace(/\\"/g, '"');
              differences.push(
                `Menu déroulant : ${cleanFormula(refFormula)} → ${cleanFormula(candFormula)}`,
              );
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
            reference: differences
              .map((d) => d.split(" → ")[0].split(": ")[1])
              .join(", "),
            new: differences.join("; "),
          });
        }
      }
    }
  });

  // Build structured summary grouped by sheet
  const diffsBySheet = new Map<string, SheetDiff[]>();
  allDiffs.forEach((diff) => {
    if (!diffsBySheet.has(diff.sheet)) {
      diffsBySheet.set(diff.sheet, []);
    }
    diffsBySheet.get(diff.sheet)!.push(diff);
  });

  let summary = "";
  if (allDiffs.length > 0) {
    summary = `Trouvé ${allDiffs.length} différence(s) dans ${diffsBySheet.size} feuille(s) :\n\n`;

    diffsBySheet.forEach((diffs, sheetName) => {
      summary += `Feuille : "${sheetName}" (${diffs.length} différence(s))\n`;
      summary += "=".repeat(60) + "\n";

      diffs.forEach((diff) => {
        summary += `  Cellule ${diff.cell} :\n`;
        summary += `    ${diff.new}\n`;
        summary += "\n";
      });

      summary += "\n";
    });
  }

  return { diffs: allDiffs, summary };
}

// Poll window.__lastDownloadBase64 and persist when available (CI safety for flaky native downloads)
function persistBase64WhenReady(
  defaultFileName: string,
  maxMs = 240000,
  intervalMs = 1000,
) {
  const start = Date.now();
  const loop = (): Cypress.Chainable<any> => {
    return cy.window({ log: false }).then((win: any) => {
      try {
        const b64 = String((win && win.__lastDownloadBase64) || "");
        const nm =
          String((win && win.__lastDownloadName) || "") || defaultFileName;
        const dlStarted = !!(win && win.__downloadStarted);
        if (b64 && b64.length > 100) {
          return cy
            .task(
              "writeBufferToDownloads",
              { base64: b64, fileName: nm },
              { timeout: 200000 },
            )
            .then(() => undefined);
        }
        // If native download path is in use and we still don't have base64 after a short grace period,
        // bail out so we don't block the queue; waitForDownloadedExcel will pick up the file.
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

function loginAndOpenDashboard(baseUrl: string) {
  cy.clearAllLocalStorage();
  cy.clearCookies();
  cy.visit(`${baseUrl}/connexion`, { timeout: 60000 });
  cy.get("body", { timeout: 60000 }).should("be.visible");
  cy.url().should("include", "/connexion");
  // Mirror login.cy.js flow exactly
  cy.get("form", { timeout: 60000 }).then(($forms) => {
    if ($forms.length) {
      cy.wrap($forms)
        .should("contain.text", "Vous avez déjà un compte")
        .get("h3")
        .should("contain.text", "Se connecter avec son compte")
        .get("input[type=email]")
        .type(user.email)
        .get("input[type=password]")
        .type(user.password)
        .get("form")
        .submit();
    } else {
      // Fallback: SSO button if present
      cy.contains(
        ".sso-bt, button, [role=button]",
        /Pages Blanches|SSO|Se connecter avec Pages Blanches/i,
        { timeout: 10000 },
      ).click({ force: true });
    }
  });
  cy.location("pathname", { timeout: 60000 }).should("include", "/panorama");
  cy.visit(`${baseUrl}/dashboard`);
  cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should("exist");
  cy.contains(
    'h6, [data-cy="backup-name"]',
    new RegExp(`^${BACKUP_LABEL}$`, "i"),
    { timeout: 20000 },
  )
    .scrollIntoView()
    .click({ force: true });
}

function setDatesEffectif(
  startISO: string,
  stopISO: string,
  prefix: string,
  labelSlug: string,
) {
  cy.get("aj-extractor-ventilation", { timeout: 20000 }).first().as("eff");

  // Programmatically set START via inner matInput to trigger ngModelChange -> onDateChanged -> valueChange -> selectDate('start', ...)
  cy.get("@eff")
    .find("aj-date-select")
    .eq(0)
    .find("input[matinput]", { timeout: 15000 })
    .then(($in) => {
      // Use ISO yyyy-mm-dd which Angular Material parses with default DateAdapter
      ($in[0] as HTMLInputElement).value = startISO;
      $in[0].dispatchEvent(new Event("input", { bubbles: true }));
      $in[0].dispatchEvent(new Event("change", { bubbles: true }));
    });
  snapshot(prefix, labelSlug, "step4-start-set");

  // Programmatically set STOP similarly
  cy.get("@eff")
    .find("aj-date-select")
    .eq(1)
    .find("input[matinput]", { timeout: 15000 })
    .then(($in) => {
      ($in[0] as HTMLInputElement).value = stopISO;
      $in[0].dispatchEvent(new Event("input", { bubbles: true }));
      $in[0].dispatchEvent(new Event("change", { bubbles: true }));
    });
  snapshot(prefix, labelSlug, "step5-stop-set");

  // Close any lingering overlays that might have been open
  cy.get("body").then(($b) => {
    const bd = $b.find("div.cdk-overlay-backdrop");
    if (bd.length) cy.wrap(bd.get(0)).click({ force: true });
  });
}

function pickCategoryEffectif(
  categoryLabel: string,
  prefix: string,
  labelSlug: string,
) {
  cy.get("aj-extractor-ventilation", { timeout: 20000 }).first().as("eff");
  // Open the selector: prefer the icon click, fallback to the text container
  cy.get("@eff").then(($eff) => {
    const hasIcon = $eff.find("aj-select mat-icon").length > 0;
    if (hasIcon) {
      cy.wrap($eff)
        .find("aj-select mat-icon", { timeout: 15000 })
        .scrollIntoView()
        .click({ force: true });
    } else {
      cy.wrap($eff)
        .find("aj-select > div > p", { timeout: 15000 })
        .scrollIntoView()
        .click({ force: true });
    }
  });
  snapshot(prefix, labelSlug, "step13-category-opened");
  const pat = categoryPattern(categoryLabel);
  cy.get(".cdk-overlay-pane", { timeout: 15000 })
    .last()
    .then(($ov) => {
      // 0) Siège special-case: recorder shows first option pseudo-checkbox
      if (/^si[eè]ge$/i.test(categoryLabel)) {
        const siegeDirect = $ov.find("#mat-option-0 > mat-pseudo-checkbox");
        if (siegeDirect.length) {
          cy.wrap(siegeDirect[0]).click({ force: true });
          snapshot(prefix, labelSlug, "step14-category-picked");
          cy.get("div.cdk-overlay-backdrop").then(($b) => {
            if ($b.length) cy.wrap($b).click({ force: true });
          });
          snapshot(prefix, labelSlug, "step15-category-closed");
          cy.get("@eff")
            .find("aj-select > div > p")
            .invoke("text")
            .then((t) => cy.log(`category.display: ${String(t).trim()}`));
          return;
        }
      }
      // 1) Try standard mat-option text
      const matNodes = Array.from(
        $ov.find("mat-option .mat-option-text, mat-option"),
      ) as HTMLElement[];
      const matOpt = matNodes.find((el) =>
        pat.test((el.textContent || "").trim()),
      );
      if (matOpt) {
        cy.wrap(matOpt).click({ force: true });
        snapshot(prefix, labelSlug, "step14-category-picked");
        cy.get("div.cdk-overlay-backdrop").then(($b) => {
          if ($b.length) cy.wrap($b).click({ force: true });
        });
        snapshot(prefix, labelSlug, "step15-category-closed");
        cy.get("@eff")
          .find("aj-select > div > p")
          .invoke("text")
          .then((t) => cy.log(`category.display: ${String(t).trim()}`));
        return;
      }
      // 2) Special handling for "Tous": checkbox/aria
      if (/^tous$/i.test(categoryLabel)) {
        const aria = $ov.find(
          '[aria-label="Tous"], [aria-label="Toutes"], [aria-label*="Toutes"]',
        );
        if (aria.length) {
          cy.wrap(aria[0]).click({ force: true });
          snapshot(prefix, labelSlug, "step14-category-picked");
          cy.get("div.cdk-overlay-backdrop").then(($b) => {
            if ($b.length) cy.wrap($b).click({ force: true });
          });
          snapshot(prefix, labelSlug, "step15-category-closed");
          cy.get("@eff")
            .find("aj-select > div > p")
            .invoke("text")
            .then((t) => cy.log(`category.display: ${String(t).trim()}`));
          return;
        }
        const idNode = $ov.find("#mat-mdc-checkbox-0-input");
        if (idNode.length) {
          cy.wrap(idNode[0]).click({ force: true });
          snapshot(prefix, labelSlug, "step14-category-picked");
          cy.get("div.cdk-overlay-backdrop").then(($b) => {
            if ($b.length) cy.wrap($b).click({ force: true });
          });
          snapshot(prefix, labelSlug, "step15-category-closed");
          cy.get("@eff")
            .find("aj-select > div > p")
            .invoke("text")
            .then((t) => cy.log(`category.display: ${String(t).trim()}`));
          return;
        }
        // Find visible text node 'Tous' and click closest clickable container
        const allNodes = Array.from($ov.find("*")) as HTMLElement[];
        const textEl = allNodes.find((el) =>
          /^Tous$/i.test((el.textContent || "").trim()),
        );
        if (textEl) {
          const clickable =
            (textEl.closest &&
              (textEl.closest(
                "label, .mdc-form-field, .mat-mdc-checkbox",
              ) as HTMLElement)) ||
            textEl;
          cy.wrap(clickable).click({ force: true });
          snapshot(prefix, labelSlug, "step14-category-picked");
          cy.get("div.cdk-overlay-backdrop").then(($b) => {
            if ($b.length) cy.wrap($b).click({ force: true });
          });
          snapshot(prefix, labelSlug, "step15-category-closed");
          cy.get("@eff")
            .find("aj-select > div > p")
            .invoke("text")
            .then((t) => cy.log(`category.display: ${String(t).trim()}`));
          return;
        }
      }
      // 3) Fallback for non-"Tous": match loosely (allow suffix like counts) and click its pseudo-checkbox
      const optEls = Array.from($ov.find("mat-option")) as HTMLElement[];
      const loose = new RegExp(
        `^\\s*${categoryLabel
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/Siege/i, "Si[eè]ge")}\\b`,
        "i",
      );
      const matchOpt = optEls.find((el) => {
        const t = (el.textContent || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        return loose.test(t);
      });
      if (matchOpt) {
        // Direct recorder id path if present
        const direct = $ov.find("#mat-option-0 > mat-pseudo-checkbox");
        if (direct.length) {
          cy.wrap(direct[0]).click({ force: true });
        } else {
          const pchk =
            (matchOpt.querySelector("mat-pseudo-checkbox") as HTMLElement) ||
            matchOpt;
          cy.wrap(pchk).click({ force: true });
        }
        snapshot(prefix, labelSlug, "step14-category-picked");
        cy.get("div.cdk-overlay-backdrop").then(($b) => {
          if ($b.length) cy.wrap($b).click({ force: true });
        });
        snapshot(prefix, labelSlug, "step15-category-closed");
        cy.get("@eff")
          .find("aj-select > div > p")
          .invoke("text")
          .then((t) => cy.log(`category.display: ${String(t).trim()}`));
        return;
      }
      throw new Error(`Category option not found in overlay: ${categoryLabel}`);
    });
}

function exportAndPersist(
  baseUrl: string,
  startISO: string,
  stopISO: string,
  categoryLabel: string,
  prefix: string,
  labelSlug: string,
) {
  cy.task("wipeDownloads");
  // Intercepts: data fetch and template fetch for XLSX
  cy.intercept("POST", "**/api/extractor/**").as("effData");
  cy.intercept("GET", "**/assets/*.xlsx*").as("effTpl");
  // Targeted diagnostics: capture start payload and poll timeline
  cy.intercept("POST", "**/api/extractor/start-filter-list").as("effStart");
  cy.intercept("POST", "**/api/extractor/status-filter-list-post").as(
    "effStatus",
  );
  snapshot(prefix, labelSlug, "step15b-downloads-wiped");
  // Install hooks BEFORE clicking export so we capture fast Blob/saveAs flows
  cy.window({ log: false }).then((win: any) => {
    try {
      // Increase app-side export max to tolerate slower CI (defaults to 3min in the app)
      try {
        (win as any).__AJ_E2E_EXPORT_MAX_MS = 1200000;
      } catch {}
      try {
        (win as any).localStorage &&
          (win as any).localStorage.setItem(
            "__AJ_E2E_EXPORT_MAX_MS",
            "1200000",
          );
      } catch {}
      try {
        cy.log(
          `dates=${startISO}..${stopISO} max=${(win as any).__AJ_E2E_EXPORT_MAX_MS}`,
        );
      } catch {}
      (win as any).__downloadStarted = false;
      (win as any).__lastDownloadName = "";
      (win as any).__lastDownloadBase64 = "";
      // Hook fetch: add cache-buster to XLSX template
      try {
        if (!(win as any).__fetchHooked) {
          const origFetch = (win as any).fetch && (win as any).fetch.bind(win);
          if (origFetch) {
            (win as any).__fetchHooked = true;
            (win as any).fetch = function (input: any, init?: any) {
              try {
                let url =
                  typeof input === "string"
                    ? input
                    : (input && input.url) || "";
                if (/\/assets\/.*\.xlsx(\?.*)?$/i.test(url)) {
                  const u = new URL(url, win.location.origin);
                  u.searchParams.set("e2e", String(Date.now()));
                  input = u.toString();
                }
              } catch {}
              return origFetch(input, init);
            } as any;
          }
        }
      } catch {}
      // Hook URL.createObjectURL to detect download start
      try {
        const origCreate = win.URL && win.URL.createObjectURL;
        if (origCreate && !(win as any).__hookedCreateObjectURL) {
          (win as any).__hookedCreateObjectURL = true;
          win.URL.createObjectURL = function (blob: any) {
            try {
              (win as any).__downloadStarted = true;
            } catch {}
            return origCreate.apply(this, arguments as any);
          } as any;
        }
      } catch {}
      // Intentionally DO NOT override Blob in Effectif to avoid brand/prototype issues in some environments.
      // Capture via anchor click + fetch of blob URL and via saveAs wrapper below.
      try {
        const proto =
          (win as any).HTMLAnchorElement &&
          (win as any).HTMLAnchorElement.prototype;
        if (proto && !(win as any).__aClickHooked) {
          (win as any).__aClickHooked = true;
          const origClick = proto.click;
          proto.click = function (this: HTMLAnchorElement) {
            try {
              const nm = (this as any).download || "";
              const href = (this as any).href || "";
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
                            const res = String(reader.result || "");
                            const base64 = res.includes(",")
                              ? res.split(",")[1]
                              : res;
                            (win as any).__lastDownloadBase64 = base64;
                          } catch {}
                        };
                        try {
                          reader.readAsDataURL(b);
                        } catch {}
                      })
                      .catch(() => {});
                  } catch {}
                }
              }
            } catch {}
            return origClick.apply(this, arguments as any);
          } as any;
        }
      } catch {}
      // Hook saveAs to capture name + base64
      try {
        const origSaveAs =
          (win as any).saveAs ||
          ((win as any).FileSaver && (win as any).FileSaver.saveAs);
        if (origSaveAs) {
          (win as any).__origSaveAs = origSaveAs;
          const wrapper = function (blob: any, name: string) {
            try {
              (win as any).__downloadStarted = true;
              (win as any).__lastDownloadName = String(name || "");
            } catch {}
            try {
              const reader = new (win as any).FileReader();
              reader.onloadend = () => {
                try {
                  const res = String(reader.result || "");
                  const base64 = res.includes(",") ? res.split(",")[1] : res;
                  (win as any).__lastDownloadBase64 = base64;
                } catch {}
              };
              reader.readAsDataURL(blob);
            } catch {}
            return origSaveAs.apply(this, arguments as any);
          } as any;
          if ((win as any).saveAs) (win as any).saveAs = wrapper;
          else if ((win as any).FileSaver)
            (win as any).FileSaver.saveAs = wrapper;
        }
      } catch {}
    } catch {}
  });
  // Fail fast on native alert emitted by the app (e.g., start error)
  cy.on("window:alert", (text) => {
    try {
      snapshot(prefix, labelSlug, "step17-window-alert");
    } catch {}
    throw new Error(`export.alert: ${String(text || "").trim()}`);
  });
  // Close any lingering overlay that may block the export click
  cy.get("body").then(($b) => {
    const bd = $b.find("div.cdk-overlay-backdrop");
    if (bd.length) cy.wrap(bd.get(0)).click({ force: true });
  });
  // Click export (selectors unchanged)
  cy.get("body").then(($body) => {
    if ($body.find("#export-excel-button").length) {
      cy.get("#export-excel-button").scrollIntoView().click({ force: true });
    } else {
      cy.get("aj-extractor-ventilation > div.exportateur-container > div > p", {
        timeout: 15000,
      })
        .scrollIntoView()
        .click({ force: true });
    }
  });
  // Best-effort diagnostics: skip start payload logging
  snapshot(prefix, labelSlug, "step16-export-clicked");
  // Do not wait on @effTpl for Effectif (it may not fetch a template). Proceed directly; hooks + polling will persist the file.
  snapshot(prefix, labelSlug, "step16b-continue-no-template-wait");

  const modalContainerSel =
    "aj-alert, aj-popup, .cdk-overlay-pane .mat-mdc-dialog-container, .cdk-overlay-pane mat-dialog-container, .cdk-overlay-pane [role=dialog], .cdk-overlay-pane aj-popup";
  const modalButtonsSel =
    "aj-alert button, aj-popup button, .cdk-overlay-pane [role=dialog] button, .cdk-overlay-pane .mat-mdc-dialog-container button, .cdk-overlay-pane mat-dialog-container button, .cdk-overlay-pane button";
  cy.get("body", { timeout: 500 }).then(($b) => {
    const has = $b.find(modalContainerSel).length > 0;
    if (has) {
      cy.get(modalContainerSel, { timeout: 15000 }).should("be.visible");
      snapshot(prefix, labelSlug, "step17-modal-visible");
      // If the modal conveys an error, fail fast rather than waiting for downloads
      cy.get(modalContainerSel).then(($m) => {
        const txt = ($m.text() || "").trim();
        if (
          /Impossible\s+de\s+d[ée]marrer\s+l['’]export|Erreur\s+serveur|Erreur\s+de\s+communication|Polling\s+timeout/i.test(
            txt,
          )
        ) {
          snapshot(prefix, labelSlug, "step17-modal-error");
          throw new Error(`export.error.modal: ${txt.slice(0, 300)}`);
        }
      });
      cy.get(modalButtonsSel, { timeout: 15000 }).then(($btns) => {
        const arr = Array.from($btns as any);
        const okBtn = (arr as any[]).find((b: any) =>
          /ok/i.test(((b as any).textContent || "").trim()),
        );
        if (okBtn) cy.wrap(okBtn).click({ force: true });
        else if ($btns.length) cy.wrap($btns[0]).click({ force: true });
        else cy.get("div.cdk-overlay-backdrop").click({ force: true });
      });
      snapshot(prefix, labelSlug, "step17-ok-clicked");
    } else {
      cy.log("export.modal.absent.continuing");
    }
  });
  // In slower environments, the confirmation modal may appear slightly later.
  // Perform a second opportunistic check after a short delay to avoid getting stuck behind an unconfirmed dialog.
  cy.wait(2500);
  cy.document().then((doc) => {
    const $lateModal = Cypress.$(modalContainerSel, doc);
    if ($lateModal && $lateModal.length) {
      snapshot(prefix, labelSlug, "step17b-modal-visible-late");
      const $buttons = Cypress.$(modalButtonsSel, doc);
      // Prefer an OK-labeled button if present, otherwise click the first available
      const ok = Array.from($buttons).find((b: any) =>
        /ok/i.test(((b as any).textContent || "").trim()),
      );
      if (ok) (ok as HTMLElement).click();
      else if ($buttons.length) ($buttons.get(0) as HTMLElement).click();
      else {
        const $backdrop = Cypress.$("div.cdk-overlay-backdrop", doc);
        if ($backdrop.length) ($backdrop.get(0) as HTMLElement).click();
      }
      snapshot(prefix, labelSlug, "step17b-ok-clicked-late");
    }
  });
  // Hooks already installed above; continue with fallback persistence and wait
  // Proactively persist from base64 if present; bail quickly if native download is already in flight
  persistBase64WhenReady(`effectif_${START}_${STOP}.xlsx`, 15000);

  // Extend Cypress command timeout for the task to accommodate slower PR exports
  cy.task(
    "waitForDownloadedExcel",
    { timeoutMs: 1200000 },
    { timeout: 1220000 },
  ).then((fileName: string) => {
    const host = new URL(baseUrl).host.replace(/[:.]/g, "-");
    const targetBase = `effectif_${host}_${START}_${STOP}_${slugifyLabel(categoryLabel)}`;
    snapshot(prefix, labelSlug, "step18-download-detected");
    return cy
      .task("moveAndNormalizeXlsx", { fileName, targetBase })
      .then(() => {
        snapshot(prefix, labelSlug, "step19-artifacts-written");
        // Assert artifact exists before leaving this export step
        cy.readFile(`cypress/artifacts/effectif/${targetBase}.json`, {
          timeout: 120000,
        });
      });
  });
  // No poll timeline writes
}

describe("Non-regression des calculs de l'extracteur (données d'effectifs)", () => {
  it("PR: exports for all categories", () => {
    if (!PR) throw new Error("CANDIDATE_FRONT_URL must be provided");
    loginAndOpenDashboard(PR);
    CATEGORIES.forEach((cat, idx) => {
      const labelSlug = slugifyLabel(cat);
      const prefix = "pr";
      // Refresh/reset page between categories to avoid sticky selection state
      cy.visit(`${PR}/dashboard`);
      cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should("exist");
      cy.contains(
        'h6, [data-cy="backup-name"]',
        new RegExp(`^${BACKUP_LABEL}$`, "i"),
        { timeout: 20000 },
      )
        .scrollIntoView()
        .click({ force: true });
      setDatesEffectif(START, STOP, prefix, labelSlug);
      pickCategoryEffectif(cat, prefix, labelSlug);
      exportAndPersist(PR, START, STOP, cat, prefix, labelSlug);
    });
  });

  it("SANDBOX: exports for all categories", () => {
    if (!SANDBOX) throw new Error("SANDBOX_FRONT_URL must be provided");
    loginAndOpenDashboard(SANDBOX);
    CATEGORIES.forEach((cat, idx) => {
      const labelSlug = slugifyLabel(cat);
      const prefix = "sandbox";
      // Refresh/reset page between categories to avoid sticky selection state
      cy.visit(`${SANDBOX}/dashboard`);
      cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should("exist");
      cy.contains(
        'h6, [data-cy="backup-name"]',
        new RegExp(`^${BACKUP_LABEL}$`, "i"),
        { timeout: 20000 },
      )
        .scrollIntoView()
        .click({ force: true });
      setDatesEffectif(START, STOP, prefix, labelSlug);
      pickCategoryEffectif(cat, prefix, labelSlug);
      exportAndPersist(SANDBOX, START, STOP, cat, prefix, labelSlug);
    });
  });

  it("Compare PR vs SANDBOX artifacts", () => {
    const hostSB = new URL(SANDBOX).host.replace(/[:.]/g, "-");
    const hostPR = new URL(PR).host.replace(/[:.]/g, "-");

    const results: Array<{
      label: string;
      diffCount: number;
      summary: string;
    }> = [];

    CATEGORIES.forEach((cat) => {
      const slug = slugifyLabel(cat);
      const sbJson = `cypress/artifacts/effectif/effectif_${hostSB}_${START}_${STOP}_${slug}.json`;
      const prJson = `cypress/artifacts/effectif/effectif_${hostPR}_${START}_${STOP}_${slug}.json`;
      cy.readFile(sbJson, { timeout: 60000 }).then((sb) => {
        cy.readFile(prJson, { timeout: 60000 }).then((pr) => {
          const { diffs, summary } = diffSheetsWithTolerance(sb, pr, 1e-6);
          if (diffs.length > 0) {
            // Write detailed diff report
            const report =
              `Category: ${cat}\n` +
              `Reference: SANDBOX (${hostSB})\n` +
              `Candidate: PR (${hostPR})\n` +
              `Date Range: ${START} to ${STOP}\n\n` +
              summary;
            cy.writeFile(`cypress/artifacts/effectif/diff_${slug}.txt`, report);
            cy.log(`❌ ${cat}: ${diffs.length} differences found`);
          } else {
            cy.log(`✅ ${cat}: No differences`);
          }
          results.push({ label: cat, diffCount: diffs.length, summary });
        });
      });
    });

    cy.then(() => {
      const failing = results.filter((r) => r.diffCount > 0);
      if (failing.length) {
        let errorMsg = `\n${"=".repeat(80)}\n`;
        errorMsg += `ÉCHEC DES TESTS DE NON-RÉGRESSION EFFECTIF\n`;
        errorMsg += `${"=".repeat(80)}\n\n`;

        // Count total sheets with differences across all categories
        let totalSheets = 0;
        failing.forEach((r) => {
          const sheetMatches = r.summary.match(/Feuille :/g);
          totalSheets += sheetMatches ? sheetMatches.length : 0;
        });

        if (failing.length === 1 && failing[0].label === "Tous") {
          // Single "Tous" category - just show sheet-level summary
          errorMsg += failing[0].summary;
        } else {
          // Multiple categories - show category grouping
          errorMsg += `Trouvé des différences dans ${failing.length} catégorie(s) :\n\n`;
          failing.forEach((r) => {
            errorMsg += `Catégorie : ${r.label}\n`;
            errorMsg += `-`.repeat(80) + "\n";
            errorMsg += r.summary;
          });
        }

        errorMsg += `\n${"=".repeat(80)}\n`;
        errorMsg += `Rapports détaillés sauvegardés dans : cypress/artifacts/effectif/diff_*.txt\n`;
        errorMsg += `${"=".repeat(80)}\n`;

        throw new Error(errorMsg);
      } else {
        cy.log(`✅ Toutes les catégories correspondent entre PR et SANDBOX`);
      }
    });
  });
});
