import { defineConfig } from "cypress";
import { verifyDownloadTasks } from "cy-verify-downloads";
import path from "path";
import fs from "fs";
import * as xlsx from "xlsx";

const jsonOnly = process.env.CY_JSON_ONLY === "1";

export default defineConfig({
  // Reporter must be top-level in Cypress >=10
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: (process.env.CY_JSON_ONLY === "1")
    ? {
        reportDir: "cypress/reports",
        reportFilename: "e2e",
        overwrite: false,
        html: false,
        json: true,
        keepJson: true,
        embeddedScreenshots: true,
        inlineAssets: true,
        saveAllAttempts: false,
        generateReport: false,
        quiet: false,
      }
    : {
        charts: true,
        reportPageTitle: "A-JUST E2E Tests Report",
        embeddedScreenshots: true,
        inlineAssets: true,
        saveAllAttempts: false,
        reportDir: "cypress/reports",
        reportFilename: "report",
        overwrite: false,
        html: false,
        json: true,
        keepJson: true,
        timestamp: "mmddyyyy_HHMMss",
        generateReport: false,
        quiet: false,
      },
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
          // Normalize to comparable JSON with formulas, formats, styles, and validation
          const wb = xlsx.readFile(outXlsx, { cellDates: false, cellNF: true, cellFormula: true, cellStyles: true });
          const out: any = { sheets: {} };
          
          // Helper to get cell address from row/col (0-indexed)
          const getCellAddress = (r: number, c: number): string => {
            return xlsx.utils.encode_cell({ r, c });
          };
          
          const trimMatrix = (rows: any[][]) => {
            let maxR = -1, maxC = -1;
            for (let r = 0; r < rows.length; r++) {
              const row = rows[r] || [];
              for (let c = 0; c < row.length; c++) {
                const v = row[c];
                if (v !== null && v !== undefined && v !== '') {
                  const hasContent = (typeof v === 'object' && (v.v !== undefined || v.f !== undefined)) || 
                                    (typeof v !== 'object' && String(v).trim() !== '');
                  if (hasContent) {
                    if (r > maxR) maxR = r;
                    if (c > maxC) maxC = c;
                  }
                }
              }
            }
            if (maxR === -1 || maxC === -1) return [] as any[];
            return rows.slice(0, maxR + 1).map((row) => (row || []).slice(0, maxC + 1));
          };
          
          for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            const range = xlsx.utils.decode_range(ws['!ref'] || 'A1');
            const rows: any[][] = [];
            
            // Extract data validation rules (dropdowns)
            const dataValidations: any = {};
            if (ws['!dataValidation']) {
              ws['!dataValidation'].forEach((dv: any) => {
                if (dv.sqref) {
                  const key = String(dv.sqref);
                  dataValidations[key] = {
                    type: dv.type || '',
                    formula1: dv.formula1 || '',
                    formula2: dv.formula2 || '',
                    operator: dv.operator || '',
                    allowBlank: dv.allowBlank,
                    showDropDown: dv.showDropDown
                  };
                }
              });
            }
            
            // Extract cell data with formulas, formats, styles, and validation
            for (let r = range.s.r; r <= range.e.r; r++) {
              const row: any[] = [];
              for (let c = range.s.c; c <= range.e.c; c++) {
                const cellAddr = getCellAddress(r, c);
                const cell = ws[cellAddr];
                
                if (!cell) {
                  row.push('');
                  continue;
                }
                
                // Build comprehensive cell data
                const cellData: any = {};
                
                // Value (displayed)
                if (cell.v !== undefined) {
                  if (typeof cell.v === 'number') {
                    cellData.v = Number(cell.v);
                  } else {
                    cellData.v = String(cell.v).trim();
                  }
                }
                
                // Formula
                if (cell.f) {
                  cellData.f = String(cell.f);
                }
                
                // Number format
                if (cell.z) {
                  cellData.z = String(cell.z);
                }
                
                // Cell type (n=number, s=string, b=boolean, e=error, d=date)
                if (cell.t) {
                  cellData.t = String(cell.t);
                }
                
                // Cell style (font, fill, border, alignment)
                if (cell.s) {
                  const style: any = {};
                  
                  // Font properties
                  if (cell.s.font) {
                    style.font = {
                      name: cell.s.font.name || '',
                      size: cell.s.font.sz || cell.s.font.size || '',
                      bold: cell.s.font.bold || false,
                      italic: cell.s.font.italic || false,
                      underline: cell.s.font.underline || false,
                      color: cell.s.font.color ? (cell.s.font.color.rgb || cell.s.font.color.theme || '') : ''
                    };
                  }
                  
                  // Fill/background color
                  if (cell.s.fill) {
                    style.fill = {
                      fgColor: cell.s.fill.fgColor ? (cell.s.fill.fgColor.rgb || cell.s.fill.fgColor.theme || '') : '',
                      bgColor: cell.s.fill.bgColor ? (cell.s.fill.bgColor.rgb || cell.s.fill.bgColor.theme || '') : '',
                      patternType: cell.s.fill.patternType || ''
                    };
                  }
                  
                  // Border
                  if (cell.s.border) {
                    style.border = {
                      top: cell.s.border.top ? { style: cell.s.border.top.style || '', color: cell.s.border.top.color || '' } : null,
                      bottom: cell.s.border.bottom ? { style: cell.s.border.bottom.style || '', color: cell.s.border.bottom.color || '' } : null,
                      left: cell.s.border.left ? { style: cell.s.border.left.style || '', color: cell.s.border.left.color || '' } : null,
                      right: cell.s.border.right ? { style: cell.s.border.right.style || '', color: cell.s.border.right.color || '' } : null
                    };
                  }
                  
                  // Alignment
                  if (cell.s.alignment) {
                    style.alignment = {
                      horizontal: cell.s.alignment.horizontal || '',
                      vertical: cell.s.alignment.vertical || '',
                      wrapText: cell.s.alignment.wrapText || false
                    };
                  }
                  
                  if (Object.keys(style).length > 0) {
                    cellData.style = style;
                  }
                }
                
                // Data validation (dropdown)
                const validationKey = Object.keys(dataValidations).find(key => {
                  try {
                    const decoded = xlsx.utils.decode_range(key);
                    return r >= decoded.s.r && r <= decoded.e.r && c >= decoded.s.c && c <= decoded.e.c;
                  } catch {
                    return false;
                  }
                });
                if (validationKey) {
                  cellData.dv = dataValidations[validationKey];
                }
                
                // If only value exists and it's simple, store it directly for backward compatibility
                if (Object.keys(cellData).length === 1 && cellData.v !== undefined) {
                  row.push(cellData.v);
                } else if (Object.keys(cellData).length === 0) {
                  row.push('');
                } else {
                  row.push(cellData);
                }
              }
              rows.push(row);
            }
            
            out.sheets[sheetName] = trimMatrix(rows);
          }
          
          const outJson = path.join(targetDir, `${safeBase}.json`);
          fs.writeFileSync(outJson, JSON.stringify(out, null, 2));
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
          // Normalize to comparable JSON with formulas, formats, styles, and validation
          const wb = xlsx.readFile(outXlsx, { cellDates: false, cellNF: true, cellFormula: true, cellStyles: true });
          const out: any = { sheets: {} };
          
          // Helper to get cell address from row/col (0-indexed)
          const getCellAddress = (r: number, c: number): string => {
            return xlsx.utils.encode_cell({ r, c });
          };
          
          const trimMatrix = (rows: any[][]) => {
            let maxR = -1, maxC = -1;
            for (let r = 0; r < rows.length; r++) {
              const row = rows[r] || [];
              for (let c = 0; c < row.length; c++) {
                const v = row[c];
                if (v !== null && v !== undefined && v !== '') {
                  const hasContent = (typeof v === 'object' && (v.v !== undefined || v.f !== undefined)) || 
                                    (typeof v !== 'object' && String(v).trim() !== '');
                  if (hasContent) {
                    if (r > maxR) maxR = r;
                    if (c > maxC) maxC = c;
                  }
                }
              }
            }
            if (maxR === -1 || maxC === -1) return [] as any[];
            return rows.slice(0, maxR + 1).map((row) => (row || []).slice(0, maxC + 1));
          };
          
          for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            const range = xlsx.utils.decode_range(ws['!ref'] || 'A1');
            const rows: any[][] = [];
            
            // Extract data validation rules (dropdowns)
            const dataValidations: any = {};
            if (ws['!dataValidation']) {
              ws['!dataValidation'].forEach((dv: any) => {
                if (dv.sqref) {
                  const key = String(dv.sqref);
                  dataValidations[key] = {
                    type: dv.type || '',
                    formula1: dv.formula1 || '',
                    formula2: dv.formula2 || '',
                    operator: dv.operator || '',
                    allowBlank: dv.allowBlank,
                    showDropDown: dv.showDropDown
                  };
                }
              });
            }
            
            // Extract cell data with formulas, formats, styles, and validation
            for (let r = range.s.r; r <= range.e.r; r++) {
              const row: any[] = [];
              for (let c = range.s.c; c <= range.e.c; c++) {
                const cellAddr = getCellAddress(r, c);
                const cell = ws[cellAddr];
                
                if (!cell) {
                  row.push('');
                  continue;
                }
                
                // Build comprehensive cell data
                const cellData: any = {};
                
                // Value (displayed)
                if (cell.v !== undefined) {
                  if (typeof cell.v === 'number') {
                    cellData.v = Number(cell.v);
                  } else {
                    cellData.v = String(cell.v).trim();
                  }
                }
                
                // Formula
                if (cell.f) {
                  cellData.f = String(cell.f);
                }
                
                // Number format
                if (cell.z) {
                  cellData.z = String(cell.z);
                }
                
                // Cell type (n=number, s=string, b=boolean, e=error, d=date)
                if (cell.t) {
                  cellData.t = String(cell.t);
                }
                
                // Cell style (font, fill, border, alignment)
                if (cell.s) {
                  const style: any = {};
                  
                  // Font properties
                  if (cell.s.font) {
                    style.font = {
                      name: cell.s.font.name || '',
                      size: cell.s.font.sz || cell.s.font.size || '',
                      bold: cell.s.font.bold || false,
                      italic: cell.s.font.italic || false,
                      underline: cell.s.font.underline || false,
                      color: cell.s.font.color ? (cell.s.font.color.rgb || cell.s.font.color.theme || '') : ''
                    };
                  }
                  
                  // Fill/background color
                  if (cell.s.fill) {
                    style.fill = {
                      fgColor: cell.s.fill.fgColor ? (cell.s.fill.fgColor.rgb || cell.s.fill.fgColor.theme || '') : '',
                      bgColor: cell.s.fill.bgColor ? (cell.s.fill.bgColor.rgb || cell.s.fill.bgColor.theme || '') : '',
                      patternType: cell.s.fill.patternType || ''
                    };
                  }
                  
                  // Border
                  if (cell.s.border) {
                    style.border = {
                      top: cell.s.border.top ? { style: cell.s.border.top.style || '', color: cell.s.border.top.color || '' } : null,
                      bottom: cell.s.border.bottom ? { style: cell.s.border.bottom.style || '', color: cell.s.border.bottom.color || '' } : null,
                      left: cell.s.border.left ? { style: cell.s.border.left.style || '', color: cell.s.border.left.color || '' } : null,
                      right: cell.s.border.right ? { style: cell.s.border.right.style || '', color: cell.s.border.right.color || '' } : null
                    };
                  }
                  
                  // Alignment
                  if (cell.s.alignment) {
                    style.alignment = {
                      horizontal: cell.s.alignment.horizontal || '',
                      vertical: cell.s.alignment.vertical || '',
                      wrapText: cell.s.alignment.wrapText || false
                    };
                  }
                  
                  if (Object.keys(style).length > 0) {
                    cellData.style = style;
                  }
                }
                
                // Data validation (dropdown)
                const validationKey = Object.keys(dataValidations).find(key => {
                  try {
                    const decoded = xlsx.utils.decode_range(key);
                    return r >= decoded.s.r && r <= decoded.e.r && c >= decoded.s.c && c <= decoded.e.c;
                  } catch {
                    return false;
                  }
                });
                if (validationKey) {
                  cellData.dv = dataValidations[validationKey];
                }
                
                // If only value exists and it's simple, store it directly for backward compatibility
                if (Object.keys(cellData).length === 1 && cellData.v !== undefined) {
                  row.push(cellData.v);
                } else if (Object.keys(cellData).length === 0) {
                  row.push('');
                } else {
                  row.push(cellData);
                }
              }
              rows.push(row);
            }
            
            out.sheets[sheetName] = trimMatrix(rows);
          }
          
          const outJson = path.join(artifactsDir, 'effectif', `${safeBase}.json`);
          fs.writeFileSync(outJson, JSON.stringify(out, null, 2));
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
        readContextFile(filePath: string) {
          try {
            const fullPath = path.join(process.cwd(), filePath);
            if (fs.existsSync(fullPath)) {
              const content = fs.readFileSync(fullPath, 'utf8');
              return JSON.parse(content);
            }
            return {};
          } catch (e) {
            console.warn('Failed to read context file:', e);
            return {};
          }
        },
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
      // Load cypress-mochawesome-reporter plugin only when not in JSON-only mode
      if (!jsonOnly) {
        require("cypress-mochawesome-reporter/plugin")(on);
      }
    },
    baseUrl: process.env.CYPRESS_BASE_URL
      ? process.env.CYPRESS_BASE_URL
      : "http://localhost:4200",
    supportFile: "cypress/support/e2e.ts",
    video: true,
    videosFolder: "cypress/videos",
    downloadsFolder: "cypress/downloads",
    defaultCommandTimeout: 10000,
    env: {
      NG_APP_SERVER_URL:
        process.env.NG_APP_SERVER_URL || "http://localhost:8081/api",
    },
  },
})
;
