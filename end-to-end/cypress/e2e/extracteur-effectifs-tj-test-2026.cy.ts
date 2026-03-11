import {
  setDatesEffectif,
  pickCategoryEffectif,
} from "../support/effectif-helpers";
import {
  loginApi,
  getUserDataApi,
  resetToDefaultPermissions,
} from "../../support/api";
import user from "../../fixtures/user.json";
import { ta } from "zod/v4/locales";

const START = "2026-01-01";
const STOP = "2026-12-31";
const BACKUP_LABEL = "TJ TEST";
const CATEGORY = "Tous";

// Installe des hooks navigateur pour capturer le fichier exporté
// (nom + contenu base64), même si l'app utilise un lien blob ou saveAs.
function installDownloadHooks() {
  cy.window({ log: false }).then((win: any) => {
    try {
      win.__downloadStarted = false;
      win.__lastDownloadName = "";
      win.__lastDownloadBase64 = "";

      const proto = win.HTMLAnchorElement && win.HTMLAnchorElement.prototype;
      if (proto && !win.__aClickHooked) {
        win.__aClickHooked = true;
        const origClick = proto.click;
        proto.click = function (this: HTMLAnchorElement) {
          try {
            const name = (this as any).download || "";
            const href = (this as any).href || "";
            if (name) win.__lastDownloadName = String(name);
            if (href) {
              win.__downloadStarted = true;
              if (/^blob:/i.test(href)) {
                try {
                  win
                    .fetch(href)
                    .then((r: any) => (r && r.blob ? r.blob() : null))
                    .then((b: any) => {
                      if (!b) return;
                      const reader = new win.FileReader();
                      reader.onloadend = () => {
                        try {
                          const res = String(reader.result || "");
                          const base64 = res.includes(",")
                            ? res.split(",")[1]
                            : res;
                          win.__lastDownloadBase64 = base64;
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

      const origSaveAs = win.saveAs || (win.FileSaver && win.FileSaver.saveAs);
      if (origSaveAs && !win.__saveAsHooked) {
        win.__saveAsHooked = true;
        const wrapper = function (blob: any, name: string) {
          try {
            win.__downloadStarted = true;
            win.__lastDownloadName = String(name || "");
          } catch {}
          try {
            const reader = new win.FileReader();
            reader.onloadend = () => {
              try {
                const res = String(reader.result || "");
                const base64 = res.includes(",") ? res.split(",")[1] : res;
                win.__lastDownloadBase64 = base64;
              } catch {}
            };
            reader.readAsDataURL(blob);
          } catch {}
          return origSaveAs.apply(this, arguments as any);
        } as any;

        if (win.saveAs) win.saveAs = wrapper;
        else if (win.FileSaver) win.FileSaver.saveAs = wrapper;
      }
    } catch {}
  });
}

// Poll window.__lastDownloadBase64 and persist when available
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

const NORMALIZED_JSON_PATH =
  "cypress/artifacts/effectif/extracteur-effectifs-tj-test-2026.json";

const HEADER_LABELS = {
  absent: "ETPT sur la période absentéisme non déduit (hors action 99)",
  temps: "Temps ventilés sur la période (hors action 99)",
  protection: "3. Total Contentieux de la protection",
  jaf: "2. Total Contentieux JAF",
  cmo: "12.31. Congé maladie ordinaire",
  absentReintegre:
    "TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)",
  totalAction99: "12. Total des indisponibilités relevant de l'action 99",
  action99Detail: "12.7 Autres Indisponibilités (Action 99)",
  etptGlobal: "ETPT global sur la période (incluant absentéisme et action 99)",
  cet30: "CET > 30 jours",
} as const;

const REQUIRED_HEADERS = {
  nom: "Nom",
  prenom: "Prénom",
  ...HEADER_LABELS,
} as const;

type MetricKey = keyof typeof HEADER_LABELS;
type HeaderKey = keyof typeof REQUIRED_HEADERS;

interface SheetContext {
  rows: string[][];
  indices: Record<HeaderKey, number>;
}

function normalizeText(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeHeaderToken(value: string): string {
  return normalizeText(value)
    .replace(/^\d+(?:[.,]\d+)*(?:\.|\)|\s)+/, "")
    .trim();
}

function matchesHeader(cellValue: string, expected: string): boolean {
  const cell = normalizeHeaderToken(cellValue);
  const exp = normalizeHeaderToken(expected);

  if (!cell) return false;

  return cell === exp;
}

function toCellText(cell: any): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "object") return String(cell.v ?? "").trim();
  return String(cell).trim();
}

function toNumber(value: any): number {
  const raw = String(value ?? "").trim();
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  return Number(normalized);
}

function readSheetContext(): Cypress.Chainable<SheetContext> {
  return cy
    .readFile(NORMALIZED_JSON_PATH, { timeout: 60000 })
    .then((normalized: any) => {
      const sheet = normalized?.sheets?.["ETPT Format DDG"];
      expect(sheet, "Onglet ETPT Format DDG présent").to.be.an("array");

      const rows = sheet.map((row: []) =>
        (Array.isArray(row) ? row : []).map(toCellText),
      );

      const requiredKeys = Object.keys(REQUIRED_HEADERS) as string[];
      const headerRowIndex = rows.findIndex((row) => {
        return requiredKeys.every((key) =>
          row.some((cell) => matchesHeader(cell, REQUIRED_HEADERS[key])),
        );
      });

      expect(headerRowIndex, "Ligne d'en-tête ETPT Format DDG").to.be.gt(0);

      const headerRow = rows[headerRowIndex] || [];
      const indices = {} as Record<HeaderKey, number>;

      requiredKeys.forEach((key) => {
        indices[key] = headerRow.findIndex((cell) =>
          matchesHeader(cell, REQUIRED_HEADERS[key]),
        );
        expect(indices[key], `Colonne \"${REQUIRED_HEADERS[key]}\"`).to.be.gte(
          0,
        );
      });

      return {
        rows: rows.slice(headerRowIndex + 1),
        indices,
      };
    });
}

function assertAgentValues(
  ctx: SheetContext,
  nom: string,
  prenom: string,
  expectedValues: Partial<Record<MetricKey, number>>,
) {
  let row: string[] | undefined = undefined;

  for (const r of ctx.rows) {
    if (r.indexOf(nom) >= 0 && r.indexOf(prenom) >= 0) {
      row = r;
      break;
    }
  }

  expect(
    !!row,
    `Agent Nom=${nom} et Prénom=${prenom} présent dans ETPT Format DDG`,
  ).to.eq(true);

  (Object.keys(expectedValues) as MetricKey[]).forEach((key) => {
    const value = toNumber(row?.[ctx.indices[key]]);
    expect(
      value,
      `Valeur \"${HEADER_LABELS[key]}\" pour ${nom}/${prenom}`,
    ).to.eq(expectedValues[key]);
  });
}

describe("Extraction effectifs TJ TEST 2026", () => {
  before(() => {
    // Prépare l'utilisateur E2E:
    // 1) login API,
    // 2) rattachement au backup TJ TEST,
    // 3) réapplication des permissions par défaut,
    // 4) login UI pour démarrer le test déjà authentifié.
    return loginApi(user.email, user.password)
      .then((resp) => {
        const userId = resp.body.user.id;
        const token = resp.body.token;

        return cy
          .request({
            method: "GET",
            url: `${Cypress.env("NG_APP_SERVER_URL") || "http://localhost:8081/api"}/juridictions/get-all-backup`,
            headers: { Authorization: token },
          })
          .then((allBackupsResp) => {
            const allBackups = Array.isArray(allBackupsResp.body)
              ? allBackupsResp.body
              : allBackupsResp.body.data || allBackupsResp.body.list || [];
            const backup = allBackups.find(
              (b: any) => b.label === BACKUP_LABEL,
            );

            if (!backup) {
              throw new Error(`${BACKUP_LABEL} introuvable en base`);
            }

            return cy
              .request({
                method: "POST",
                url: `${Cypress.env("NG_APP_SERVER_URL") || "http://localhost:8081/api"}/users/update-account`,
                headers: { Authorization: token },
                body: {
                  userId,
                  access: [],
                  ventilations: [backup.id],
                  referentielIds: [],
                },
              })
              .then(() => getUserDataApi(token))
              .then((userDataResp) => {
                const ventilations = (userDataResp.body.data.backups || []).map(
                  (v: any) => v.id,
                );
                return resetToDefaultPermissions(userId, ventilations, token);
              });
          });
      })
      .then(() => {
        // @ts-ignore command signature in declarations is outdated
        return cy.login();
      })
      .then(() => {
        cy.location("pathname", { timeout: 60000 }).should(
          "include",
          "/panorama",
        );
      });
  });

  before(() => {
    const baseUrl = Cypress.config("baseUrl") || "http://localhost:4200";

    cy.task("wipeDownloads");
    cy.visit(`${baseUrl}/dashboard`);
    installDownloadHooks();

    cy.get('h6, [data-cy="backup-name"]', { timeout: 20000 }).should("exist");
    cy.contains(
      'h6, [data-cy="backup-name"]',
      new RegExp(`^${BACKUP_LABEL}$`, "i"),
      { timeout: 20000 },
    )
      .scrollIntoView()
      .click({ force: true });

    setDatesEffectif(START, STOP);
    pickCategoryEffectif(CATEGORY);

    cy.get("body").then(($body) => {
      if ($body.find("#export-excel-button").length) {
        cy.get("#export-excel-button").scrollIntoView().click({ force: true });
      } else {
        cy.get(
          "aj-extractor-ventilation > div.exportateur-container > div > p",
          { timeout: 15000 },
        )
          .scrollIntoView()
          .click({ force: true });
      }
    });

    // Si une modale de confirmation apparaît, on la valide.
    const modalContainerSel =
      "aj-alert, aj-popup, .cdk-overlay-pane .mat-mdc-dialog-container, .cdk-overlay-pane mat-dialog-container, .cdk-overlay-pane [role=dialog], .cdk-overlay-pane aj-popup";
    const modalButtonsSel =
      "aj-alert button, aj-popup button, .cdk-overlay-pane [role=dialog] button, .cdk-overlay-pane .mat-mdc-dialog-container button, .cdk-overlay-pane mat-dialog-container button, .cdk-overlay-pane button";

    cy.get("body", { timeout: 1000 }).then(($b) => {
      if ($b.find(modalContainerSel).length > 0) {
        cy.get(modalButtonsSel, { timeout: 15000 }).then(($btns) => {
          const arr = Array.from($btns as any);
          const okBtn = (arr as any[]).find((b: any) =>
            /ok/i.test(((b as any).textContent || "").trim()),
          );
          if (okBtn) cy.wrap(okBtn).click({ force: true });
          else if ($btns.length) cy.wrap($btns[0]).click({ force: true });
        });
      }
    });

    persistBase64WhenReady(
      `effectifs_tj_test_${START}_${STOP}.xlsx`,
      120000,
      1000,
    );

    // Wait for download
    cy.task(
      "waitForDownloadedExcel",
      { timeoutMs: 1200000 },
      { timeout: 1220000 },
    ).then((fileName: string) => {
      expect(fileName).to.match(/\.xlsx$/i);
      const targetBase = "extracteur-effectifs-tj-test-2026";
      return cy
        .task("moveAndNormalizeXlsx", { fileName, targetBase })
        .then(() => {
          cy.readFile(`cypress/artifacts/effectif/${targetBase}.json`, {
            timeout: 120000,
          });
        });
    });
  });

  it("Basique", () => {
    readSheetContext().then((ctx) => {
      assertAgentValues(ctx, "Basique", "Extracteur", {
        absent: 1,
        temps: 1,
      });
    });
  });

  it("Temps Partiel Simple", () => {
    readSheetContext().then((ctx) => {
      assertAgentValues(ctx, "Temps Partiel Simple", "Extracteur", {
        absent: 0.8,
        temps: 0.8,
        etptGlobal: 0.8,
      });
    });
  });

  it("Multi Ventilation", () => {
    readSheetContext().then((ctx) => {
      assertAgentValues(ctx, "Multi Ventilation", "Extracteur", {
        absent: 1,
        temps: 1,
        protection: 0.6,
        jaf: 0.4,
        etptGlobal: 1,
      });
    });
  });

  it("Absenteisme Simple", () => {
    readSheetContext().then((ctx) => {
      assertAgentValues(ctx, "Absenteisme Simple", "Extracteur", {
        absent: 1,
        temps: 1,
        protection: 1,
        cmo: 0.15,
        absentReintegre: 0.15,
        etptGlobal: 1,
      });
    });
  });

  it("Action 99 Simple", () => {
    readSheetContext().then((ctx) => {
      assertAgentValues(ctx, "Action 99 Simple", "Extracteur", {
        absent: 0.8,
        temps: 0.8,
        protection: 0.8,
        totalAction99: 0.2,
        action99Detail: 0.2,
        etptGlobal: 1,
      });
    });
  });

  it("CET > 30Jours", () => {
    readSheetContext().then((ctx) => {
      assertAgentValues(ctx, "CET > 30Jours", "Extracteur", {
        absent: 0.85,
        temps: 0.85,
        protection: 0.85,
        totalAction99: 0.15,
        cet30: 0.15,
        etptGlobal: 1,
      });
    });
  });

  it("Multi Indispo Mixtes", () => {
    readSheetContext().then((ctx) => {
      assertAgentValues(ctx, "Multi Indispo Mixtes", "Extracteur", {
        absent: 0.85,
        temps: 0.85,
        protection: 0.85,
        totalAction99: 0.15,
        action99Detail: 0.15,
        cmo: 0.1,
        absentReintegre: 0.1,
        etptGlobal: 1,
      });
    });
  });

  it("Indispo + Multi Ventilation", () => {
    readSheetContext().then((ctx) => {
      assertAgentValues(ctx, "Indispo + Multi Ventilation", "Extracteur", {
        absent: 1,
        temps: 1,
        jaf: 0.4,
        protection: 0.6,
        cmo: 0.2,
        absentReintegre: 0.2,
        etptGlobal: 1,
      });
    });
  });
});
