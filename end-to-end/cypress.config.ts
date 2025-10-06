import { defineConfig } from "cypress";
import { verifyDownloadTasks } from "cy-verify-downloads";
import path from "path";
import fs from "fs";
import * as xlsx from "xlsx";

export default defineConfig({
  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    specPattern: "**/*.cy.ts",
  },
  e2e: {
    testIsolation: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      const downloadsDir = path.join(config.projectRoot, "cypress", "downloads");
      const artifactsDir = path.join(config.projectRoot, "cypress", "artifacts");
      function wipeDownloads() {
        try {
          fs.mkdirSync(downloadsDir, { recursive: true });
          for (const f of fs.readdirSync(downloadsDir)) {
            const p = path.join(downloadsDir, f);
            try { fs.unlinkSync(p); } catch {}
          }
          return true;
        } catch (e) {
          console.error("Failed to wipe downloads:", e);
          return false;
        }
      }
      function writeBufferToDownloads({ base64, fileName }: { base64: string; fileName: string }) {
        try {
          fs.mkdirSync(downloadsDir, { recursive: true });
          const safeName = (fileName || `activite_${Date.now()}.xlsx`).replace(/[^a-zA-Z0-9._-]+/g, '_');
          const outPath = path.join(downloadsDir, safeName.endsWith('.xlsx') ? safeName : `${safeName}.xlsx`);
          const buf = Buffer.from(base64, 'base64');
          fs.writeFileSync(outPath, buf);
          // eslint-disable-next-line no-console
          console.log(`[DOWNLOADS] wrote ${outPath} (${buf.length} bytes)`);
          return outPath;
        } catch (e) {
          console.error('Failed to write buffer to downloads:', e);
          return null;
        }
      }
      function moveAndNormalizeXlsxTo({ fileName, targetBase, subdir }: { fileName: string; targetBase: string; subdir: string }) {
        try {
          fs.mkdirSync(downloadsDir, { recursive: true });
          const targetDir = path.join(artifactsDir, subdir);
          fs.mkdirSync(targetDir, { recursive: true });
          const srcPath = path.isAbsolute(fileName) ? fileName : path.join(downloadsDir, fileName);
          const safeBase = targetBase
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
          const outXlsx = path.join(targetDir, `${safeBase}.xlsx`);
          fs.copyFileSync(srcPath, outXlsx);
          const wb = xlsx.readFile(outXlsx, { cellDates: false, cellNF: false, cellText: false });
          const out: any = { sheets: {} };
          const trimMatrix = (rows: any[][]) => {
            let maxR = -1, maxC = -1;
            for (let r = 0; r < rows.length; r++) {
              const row = rows[r] || [];
              for (let c = 0; c < row.length; c++) {
                const v = row[c];
                if (v !== null && v !== undefined && String(v).trim() !== '') {
                  if (r > maxR) maxR = r;
                  if (c > maxC) maxC = c;
                }
              }
            }
            if (maxR === -1 || maxC === -1) return [] as any[];
            return rows.slice(0, maxR + 1).map((row) => (row || []).slice(0, maxC + 1));
          };
          for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            const rows: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1, raw: true });
            const norm = trimMatrix(rows).map((row) => row.map((cell) => {
              if (typeof cell === 'number') return Number(cell);
              if (cell === null || cell === undefined) return '';
              const s = String(cell).trim();
              const n = Number(s.replace(/\s+/g, '').replace(',', '.'));
              return Number.isFinite(n) && s.match(/^[-+]?\d*[\.,]?\d+(e[-+]?\d+)?$/i) ? n : s;
            }));
            out.sheets[sheetName] = norm;
          }
          const outJson = path.join(targetDir, `${safeBase}.json`);
          fs.writeFileSync(outJson, JSON.stringify(out));
          return { outXlsx, outJson };
        } catch (e) {
          console.error("Failed to move/normalize xlsx:", e);
          return null;
        }
      }
      function waitForDownloadedExcel({ timeoutMs = 180000 }: { timeoutMs?: number }) {
        const t0 = Date.now();
        return new Promise<string>((resolve, reject) => {
          const timer = setInterval(() => {
            try {
              fs.mkdirSync(downloadsDir, { recursive: true });
              const files = fs.readdirSync(downloadsDir).filter((n) => n.endsWith('.xlsx') && !n.endsWith('.crdownload'));
              if (files.length) {
                clearInterval(timer);
                resolve(files[0]);
                return;
              }
            } catch (e) {
              // ignore and keep polling
            }
            if (Date.now() - t0 > timeoutMs) {
              clearInterval(timer);
              reject(new Error("download timeout"));
            }
          }, 1000);
        });
      }
      function moveAndNormalizeXlsx({ fileName, targetBase }: { fileName: string; targetBase: string }) {
        try {
          fs.mkdirSync(downloadsDir, { recursive: true });
          fs.mkdirSync(path.join(artifactsDir, 'effectif'), { recursive: true });
          const srcPath = path.isAbsolute(fileName) ? fileName : path.join(downloadsDir, fileName);
          const safeBase = targetBase
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
          const outXlsx = path.join(artifactsDir, 'effectif', `${safeBase}.xlsx`);
          fs.copyFileSync(srcPath, outXlsx);
          // Normalize to comparable JSON
          const wb = xlsx.readFile(outXlsx, { cellDates: false, cellNF: false, cellText: false });
          const out: any = { sheets: {} };
          const trimMatrix = (rows: any[][]) => {
            let maxR = -1, maxC = -1;
            for (let r = 0; r < rows.length; r++) {
              const row = rows[r] || [];
              for (let c = 0; c < row.length; c++) {
                const v = row[c];
                if (v !== null && v !== undefined && String(v).trim() !== '') {
                  if (r > maxR) maxR = r;
                  if (c > maxC) maxC = c;
                }
              }
            }
            if (maxR === -1 || maxC === -1) return [] as any[];
            return rows.slice(0, maxR + 1).map((row) => (row || []).slice(0, maxC + 1));
          };
          for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            const rows: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1, raw: true });
            const norm = trimMatrix(rows).map((row) => row.map((cell) => {
              if (typeof cell === 'number') return Number(cell);
              if (cell === null || cell === undefined) return '';
              const s = String(cell).trim();
              const n = Number(s.replace(/\s+/g, '').replace(',', '.'));
              return Number.isFinite(n) && s.match(/^[-+]?\d*[\.,]?\d+(e[-+]?\d+)?$/i) ? n : s;
            }));
            out.sheets[sheetName] = norm;
          }
          const outJson = path.join(artifactsDir, 'effectif', `${safeBase}.json`);
          fs.writeFileSync(outJson, JSON.stringify(out));
          return { outXlsx, outJson };
        } catch (e) {
          console.error("Failed to move/normalize xlsx:", e);
          return null;
        }
      }
      function wipeEffectifArtifacts() {
        try {
          const effDir = path.join(artifactsDir, 'effectif');
          fs.mkdirSync(effDir, { recursive: true });
          const files = fs.readdirSync(effDir);
          for (const f of files) {
            const p = path.join(effDir, f);
            try { fs.unlinkSync(p); } catch {}
          }
          // eslint-disable-next-line no-console
          console.log(`[ARTIFACTS] wiped ${files.length} file(s) in ${effDir}`);
          return true;
        } catch (e) {
          console.error("Failed to wipe effectif artifacts:", e);
          return false;
        }
      }
      function wipeActiviteArtifacts() {
        try {
          const dir = path.join(artifactsDir, 'activite');
          fs.mkdirSync(dir, { recursive: true });
          const files = fs.readdirSync(dir);
          for (const f of files) {
            const p = path.join(dir, f);
            try { fs.unlinkSync(p); } catch {}
          }
          // eslint-disable-next-line no-console
          console.log(`[ARTIFACTS] wiped ${files.length} file(s) in ${dir}`);
          return true;
        } catch (e) {
          console.error("Failed to wipe activite artifacts:", e);
          return false;
        }
      }
      on("task", Object.assign({}, verifyDownloadTasks as any, {
        saveLabels({ host, labels }: { host: string; labels: string[] }) {
          try {
            const debugDir = path.join(process.cwd(), "cypress", "debug");
            fs.mkdirSync(debugDir, { recursive: true });
            const file = path.join(debugDir, `tj-labels-${host}.json`);
            fs.writeFileSync(file, JSON.stringify(labels, null, 2), "utf8");
            // eslint-disable-next-line no-console
            console.log(`[TJ LABELS] ${host}:`, labels);
            return file;
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to save labels:", e);
            return null;
          }
        },
        saveDomHtml({ filename, html }: { filename: string; html: string }) {
          try {
            const reportsDir = path.join(process.cwd(), "cypress", "reports");
            fs.mkdirSync(reportsDir, { recursive: true });
            const file = path.join(reportsDir, filename);
            fs.writeFileSync(file, html, "utf8");
            // eslint-disable-next-line no-console
            console.log(`[DOM SNAPSHOT] Wrote: ${file}`);
            return file;
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to write DOM snapshot:", e);
            return null;
          }
        },
        wipeDownloads,
        waitForDownloadedExcel,
        moveAndNormalizeXlsx,
        moveAndNormalizeXlsxTo,
        wipeEffectifArtifacts,
        wipeActiviteArtifacts,
        writeBufferToDownloads,
      }));
      // Pre/post-run wipes to avoid stale artifacts regardless of support hooks
      const shouldWipe = !process.env.CYPRESS_KEEP_ARTIFACTS && !config.env?.KEEP_ARTIFACTS;
      if (shouldWipe) {
        try { wipeEffectifArtifacts(); } catch {}
        try { wipeActiviteArtifacts(); } catch {}
      }
      on('before:run', () => {
        if (shouldWipe) {
          try { wipeEffectifArtifacts(); } catch {}
          try { wipeActiviteArtifacts(); } catch {}
        }
      });
      on('after:run', () => {
        if (shouldWipe) {
          try { wipeEffectifArtifacts(); } catch {}
          try { wipeActiviteArtifacts(); } catch {}
        }
      });
      // Configuration pour mochawesome reporter
      require("cypress-mochawesome-reporter/plugin")(on);
    },
    baseUrl: process.env.CYPRESS_BASE_URL
      ? process.env.CYPRESS_BASE_URL
      : "http://localhost:4200",
    supportFile: "cypress/support/e2e.ts",
    video: true,
    videosFolder: "cypress/videos",
    downloadsFolder: "cypress/downloads",
    defaultCommandTimeout: 10000,
    // Configuration du reporter
    reporter: "cypress-mochawesome-reporter",
    reporterOptions: {
      charts: true,
      reportPageTitle: "A-JUST E2E Tests Report",
      embeddedScreenshots: true,
      inlineAssets: true,
      saveAllAttempts: false,
      reportDir: "cypress/reports",
      reportFilename: "report",
      overwrite: false,
      html: true,
      json: true,
      timestamp: "mmddyyyy_HHMMss",
      // Force la génération du fichier JSON
      generateReport: true,
      quiet: false,
    },
    env: {
      NG_APP_SERVER_URL:
        process.env.NG_APP_SERVER_URL || "http://localhost:8081/api",
    },
  },
});
